
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileUp, ListPlus, RefreshCw, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { formatMist } from '../lib/sui';
import { useSeal } from '../hooks/useSeal';
import { uploadToWalrus } from '../lib/walrus';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';

async function readFileForBackend(file: File) {
  if (file.type.startsWith('text/') || file.name.match(/\.(csv|json|txt|md)$/i)) {
    return file.text();
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return JSON.stringify({
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    encoding: 'base64',
    data: btoa(binary),
  });
}

export default function SellData() {
  const account = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const queryClient = useQueryClient();
  const { encryptData } = useSeal();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceMist, setPriceMist] = useState<number | ''>('');
  const [datasetText, setDatasetText] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const listings = useQuery({
    queryKey: ['marketplace-listings'],
    queryFn: api.listings,
    refetchInterval: 15000,
  });

  const publish = useMutation({
    mutationFn: async () => {
      if (!datasetText.trim()) throw new Error('Add data before publishing.');
      
      // Generate a random 32-byte hex for the Seal policy ID
      const policyIdBytes = crypto.getRandomValues(new Uint8Array(32));
      const policyId = '0x' + Array.from(policyIdBytes).map(b => b.toString(16).padStart(2, '0')).join('');

      // 1. Encrypt directly in the browser
      const encryptedBytes = await encryptData(datasetText, policyId);
      
      // 2. Upload to Walrus from the browser
      const blobId = await uploadToWalrus(encryptedBytes);

      // 3. Send IDs to backend to register the on-chain listing
      return api.listDataset([blobId], policyId, { title, description }, Number(priceMist));
    },
    onSuccess: async (data) => {
      setResult(`Listing published: ${data.listingId}`);
      await queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
    },
    onError: (error) => setResult(error.stack || error.message),
  });

  const totalListings = listings.data?.listings.filter((listing) => listing.isActive).length ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto w-full">
      <div className="mb-8 flex flex-col items-start justify-between gap-6 xl:flex-row">
        <div>
          <p className="mb-3 text-xs font-mono uppercase tracking-widest text-outline">Seller workspace</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mb-3">Sell Data</h1>
          <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Add the data you want to sell, set a price, and publish. The backend encrypts the data with Seal, uploads it to
            Walrus, and creates the marketplace listing.
          </p>
        </div>
        <button
          onClick={() => listings.refetch()}
          className="rounded-lg border border-outline-variant bg-surface-dim px-4 py-3 font-semibold flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-outline-variant bg-surface-dim p-5">
          <p className="text-xs font-mono uppercase tracking-widest text-outline">Active listings</p>
          <p className="mt-3 text-3xl font-bold">{totalListings}</p>
          <p className="mt-2 text-sm text-on-surface-variant">Datasets currently visible in the marketplace.</p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-dim p-5">
          <p className="text-xs font-mono uppercase tracking-widest text-outline">Your price</p>
          <p className="mt-3 text-3xl font-bold">{priceMist !== '' ? formatMist(priceMist) : '-'}</p>
          <p className="mt-2 text-sm text-on-surface-variant">Agents pay this amount when they buy the listing.</p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-dim p-5">
          <p className="text-xs font-mono uppercase tracking-widest text-outline">Backend handles</p>
          <p className="mt-3 text-lg font-bold">Encryption + storage</p>
          <p className="mt-2 text-sm text-on-surface-variant">No storage ID or Seal policy ID is needed from you.</p>
        </div>
      </div>

      <section className="bg-surface-dim border border-outline-variant rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ListPlus className="w-5 h-5 text-primary" /> Create Listing
        </h2>

        <div className="mb-4 rounded-lg border border-dashed border-outline-variant bg-surface p-4">
          <label className="flex cursor-pointer flex-col items-center justify-center text-center">
            <FileUp className="mb-2 h-6 w-6 text-primary" />
            <span className="text-sm font-semibold">
              {selectedFileName ?? 'Choose a CSV, JSON, TXT, PDF, or paste data below'}
            </span>
            <span className="mt-1 text-xs text-outline">
              Text files are loaded directly. Binary files are packaged before backend encryption.
            </span>
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.json,.csv,.txt,.md,application/pdf,application/json,text/csv,text/plain,text/markdown"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setSelectedFileName(file.name);
                readFileForBackend(file)
                  .then(setDatasetText)
                  .catch((error) => setResult(error.message));
              }}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm"
            placeholder="e.g. DeFi Trading Signals — Q3 2026"
          />
          <input
            value={priceMist}
            onChange={(event) => {
              const val = event.target.value;
              setPriceMist(val === '' ? '' : Number(val));
            }}
            type="number"
            className="rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm"
            placeholder="e.g. 5000000"
          />
        </div>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-3 h-20 w-full resize-none rounded-lg border border-outline-variant bg-surface p-4 text-sm"
          placeholder="e.g. Backtested market signals across 12 SUI DEX pools with 83% accuracy"
        />
        <textarea
          value={datasetText}
          onChange={(event) => setDatasetText(event.target.value)}
          className="mt-3 h-44 w-full resize-y rounded-lg border border-outline-variant bg-surface p-4 text-sm"
          placeholder="Data to sell. Each line becomes a backend chunk."
        />

        <button
          onClick={() => publish.mutate()}
          disabled={publish.isPending || !title.trim() || !description.trim() || !datasetText.trim() || priceMist === '' || priceMist <= 0}
          className="mt-4 w-full rounded-lg bg-tertiary px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          <UploadCloud className="mr-2 inline h-4 w-4" />
          {publish.isPending ? 'Publishing...' : 'Publish Listing'}
        </button>
      </section>

      {result ? (
        <pre className="mt-6 max-h-40 overflow-auto rounded-lg border border-outline-variant bg-surface-dim p-3 text-xs">
          {JSON.stringify({ result }, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
