import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Database, FileUp, KeyRound, Lock, Plus, ShieldCheck, Store, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
  buildExtendBlobTx,
  buildMintOperatorCapTx,
  buildPruneBlobTx,
  buildRegisterBlobTx,
  formatAddress,
  getManagedBlobs,
  getOwnedCapabilities,
} from '../lib/sui';

import { useSeal } from '../hooks/useSeal';
import { uploadToWalrus } from '../lib/walrus';

const DAY_MS = 86_400_000;

function bytesToBase64(bytes: Uint8Array) {
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function Encryption() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();
  const { encryptData } = useSeal();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [plainText, setPlainText] = useState('Sensitive Synapse execution log');
  const [policyId, setPolicyId] = useState(`manual_policy_${Date.now()}`);
  const [recipient, setRecipient] = useState('');
  const [blobId, setBlobId] = useState('');
  const [managedBlobId, setManagedBlobId] = useState('');
  const [txResult, setTxResult] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const vault = useQuery({ queryKey: ['seal-vault'], queryFn: api.sealVault });
  const caps = useQuery({
    queryKey: ['owned-caps', account?.address],
    queryFn: () => getOwnedCapabilities(suiClient, account!.address),
    enabled: Boolean(account),
  });
  const managedBlobs = useQuery({
    queryKey: ['managed-blobs'],
    queryFn: () => getManagedBlobs(suiClient),
  });

  const encrypt = useMutation({
    mutationFn: async () => {
      const encryptedBytes = await encryptData(plainText, policyId);
      const uploadedBlobId = await uploadToWalrus(encryptedBytes);
      return { blobId: uploadedBlobId, listingId: policyId };
    },
    onSuccess: (data) => setBlobId(data.blobId),
  });

  const loadFile = async (file: File) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const payload = {
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      lastModified: file.lastModified,
      encoding: 'base64',
      data: bytesToBase64(bytes),
    };
    setSelectedFile(file);
    setPlainText(JSON.stringify(payload, null, 2));
    setPolicyId(`dataset_${file.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_${Date.now()}`);
  };

  const accessAdminCap = caps.data?.accessAdminCaps[0]?.id;

  const runTx = async (txFactory: () => any) => {
    if (!account) throw new Error('Connect a Sui testnet wallet first.');
    const res = await signAndExecute({ transaction: txFactory(), account });
    setTxResult(res.digest);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['owned-caps', account.address] }),
      queryClient.invalidateQueries({ queryKey: ['managed-blobs'] }),
    ]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full">
      <div className="mb-10">
        <p className="mb-3 text-xs font-mono uppercase tracking-widest text-outline">Seller journey</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mb-3 flex items-center gap-4">
          <div className="w-10 h-10 bg-tertiary-container rounded-lg flex items-center justify-center text-tertiary">
            <Lock className="w-6 h-6" />
          </div>
          Encrypt and Upload
        </h1>
        <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
          Encrypt PDFs, JSON, CSV, or pasted data directly in the browser with Seal, then upload ciphertext to Walrus for
          marketplace listing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <section className="bg-surface-dim border border-outline-variant rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-tertiary" /> Vault
          </h2>
          <div className="space-y-3 text-sm">
            <p><span className="text-outline">Vault ID:</span> <span className="font-mono">{vault.data?.vaultId || 'Loading...'}</span></p>
            <p><span className="text-outline">Seal package:</span> <span className="font-mono">{vault.data?.packageId || '-'}</span></p>
            <p><span className="text-outline">Key servers:</span> {vault.data?.keyServers.length ?? 0}</p>
          </div>
        </section>

        <section className="bg-surface-dim border border-outline-variant rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-tertiary" /> My Capabilities
          </h2>
          <div className="space-y-2 text-sm">
            <p>OperatorCaps: <span className="font-mono">{caps.data?.operatorCaps.length ?? 0}</span></p>
            <p>Access AdminCaps: <span className="font-mono">{caps.data?.accessAdminCaps.length ?? 0}</span></p>
            <p className="font-mono text-xs text-outline">{accessAdminCap ? formatAddress(accessAdminCap, 10) : 'Minting requires access_control::AdminCap'}</p>
          </div>
        </section>

        <section className="bg-surface-dim border border-outline-variant rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Mint OperatorCap
          </h2>
          <input
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm font-mono"
            placeholder="Recipient address"
          />
          <button
            onClick={() => runTx(() => buildMintOperatorCapTx(accessAdminCap!, recipient || account!.address)).catch((error) => setTxResult(error.message))}
            disabled={!account || !accessAdminCap}
            className="mt-3 w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            Mint Capability
          </button>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section className="bg-surface-dim border border-outline-variant rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-tertiary" /> Encrypt & Upload
          </h2>
          <label className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-outline-variant bg-surface px-4 py-6 text-center">
            <FileUp className="mb-2 h-6 w-6 text-primary" />
            <span className="text-sm font-semibold text-on-surface">
              {selectedFile ? selectedFile.name : 'Choose PDF, JSON, CSV, or text file'}
            </span>
            <span className="mt-1 text-xs text-outline">
              {selectedFile ? `${selectedFile.size.toLocaleString()} bytes staged locally` : 'File bytes are encoded and encrypted in this browser'}
            </span>
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.json,.csv,.txt,application/pdf,application/json,text/csv,text/plain"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) loadFile(file).catch((error) => setTxResult(error.message));
              }}
            />
          </label>
          <input
            value={policyId}
            onChange={(event) => setPolicyId(event.target.value)}
            className="mb-3 w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm font-mono"
            placeholder="Seal policy/listing ID"
          />
          <textarea
            value={plainText}
            onChange={(event) => setPlainText(event.target.value)}
            className="h-32 w-full resize-none rounded-lg border border-outline-variant bg-surface p-4 text-sm"
          />
          <button
            onClick={() => encrypt.mutate()}
            disabled={!plainText.trim() || encrypt.isPending}
            className="mt-3 w-full rounded-lg bg-tertiary px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {encrypt.isPending ? 'Processing...' : 'Encrypt & Upload'}
          </button>
          {encrypt.data || encrypt.error ? (
            <div className="mt-4 rounded-lg border border-outline-variant bg-surface p-3">
              <pre className="max-h-32 overflow-auto text-xs">
                {JSON.stringify(encrypt.data ?? { error: encrypt.error.message }, null, 2)}
              </pre>
              {encrypt.data ? (
                <Link
                  to="/marketplace"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"
                >
                  <Store className="h-4 w-4" /> Publish listing
                </Link>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="bg-surface-dim border border-outline-variant rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" /> Data Lifecycle
          </h2>
          <input
            value={blobId}
            onChange={(event) => setBlobId(event.target.value)}
            className="mb-3 w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm font-mono"
            placeholder="Walrus blob ID to register"
          />
          <button
            onClick={() => runTx(() => buildRegisterBlobTx(blobId, 30 * DAY_MS)).catch((error) => setTxResult(error.message))}
            disabled={!account || !blobId}
            className="mb-5 w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            Register ManagedBlob
          </button>
          <input
            value={managedBlobId}
            onChange={(event) => setManagedBlobId(event.target.value)}
            className="mb-3 w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm font-mono"
            placeholder="ManagedBlob object ID"
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => runTx(() => buildExtendBlobTx(managedBlobId, 30 * DAY_MS)).catch((error) => setTxResult(error.message))}
              disabled={!account || !managedBlobId}
              className="rounded-lg border border-outline-variant bg-surface px-4 py-3 font-semibold disabled:opacity-50"
            >
              Extend 30d
            </button>
            <button
              onClick={() => runTx(() => buildPruneBlobTx(managedBlobId)).catch((error) => setTxResult(error.message))}
              disabled={!account || !managedBlobId}
              className="rounded-lg bg-error px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              Prune Expired
            </button>
          </div>
        </section>
      </div>

      <div className="bg-surface-dim border border-outline-variant rounded-lg overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-xl font-bold">Managed Blobs</h2>
          <span className="text-xs font-mono text-outline">{managedBlobs.data?.length ?? 0} indexed from events</span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant text-[11px] font-mono tracking-wider uppercase text-outline bg-surface-variant/30">
              <th className="py-4 px-6">Object</th>
              <th className="py-4 px-6">Blob ID</th>
              <th className="py-4 px-6">Agent</th>
              <th className="py-4 px-6">Expires</th>
            </tr>
          </thead>
          <tbody>
            {(managedBlobs.data ?? []).map((blob) => (
              <tr key={blob.id} className="border-b border-outline-variant hover:bg-surface/50">
                <td className="py-4 px-6 font-mono text-sm">{formatAddress(blob.id, 10)}</td>
                <td className="py-4 px-6 font-mono text-sm text-tertiary">{blob.blobId}</td>
                <td className="py-4 px-6 font-mono text-sm text-outline">{formatAddress(blob.agentId)}</td>
                <td className="py-4 px-6 font-mono text-sm">{new Date(blob.expiresAt).toLocaleString()}</td>
              </tr>
            ))}
            {!managedBlobs.data?.length ? (
              <tr>
                <td className="py-6 px-6 text-sm text-outline" colSpan={4}>No managed blob events found yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {txResult ? <p className="mt-4 rounded-lg border border-outline-variant bg-surface-dim p-3 font-mono text-xs">{txResult}</p> : null}
    </div>
  );
}

export default Encryption;
