import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Coins, KeyRound, ListPlus, RefreshCw, ShoppingCart, Store } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api, type DatasetListing } from '../lib/api';
import {
  buildDelistDatasetTx,
  buildListDatasetTx,
  buildPurchaseDatasetTx,
  formatAddress,
  formatMist,
  getChainListings,
  getOwnedCapabilities,
} from '../lib/sui';

type MergedListing = DatasetListing & {
  chainSource?: boolean;
  backendSource?: boolean;
};

export default function Marketplace() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [title, setTitle] = useState('Sui Alpha Signals');
  const [description, setDescription] = useState('Encrypted market signals for autonomous agent research.');
  const [priceMist, setPriceMist] = useState(5_000_000);
  const [chunks, setChunks] = useState('Signal 1: DeepBook spread widened\nSignal 2: Liquidity rotation detected');
  const [blobIds, setBlobIds] = useState('blob_demo_1, blob_demo_2');
  const [sealPolicyId, setSealPolicyId] = useState(`policy_${Date.now()}`);
  const [receiptId, setReceiptId] = useState('');
  const [txResult, setTxResult] = useState<string | null>(null);

  const backendListings = useQuery({
    queryKey: ['marketplace-listings'],
    queryFn: api.listings,
    refetchInterval: 15000,
  });
  const chainListings = useQuery({
    queryKey: ['chain-listings'],
    queryFn: () => getChainListings(suiClient),
    refetchInterval: 20000,
  });
  const caps = useQuery({
    queryKey: ['owned-caps', account?.address],
    queryFn: () => getOwnedCapabilities(suiClient, account!.address),
    enabled: Boolean(account),
  });

  const listings = useMemo(() => {
    const map = new Map<string, MergedListing>();
    for (const listing of backendListings.data?.listings ?? []) {
      map.set(listing.id, { ...listing, backendSource: true });
    }
    for (const listing of chainListings.data ?? []) {
      map.set(listing.id, { ...map.get(listing.id), ...listing, chainSource: true });
    }
    return [...map.values()];
  }, [backendListings.data, chainListings.data]);

  const backendList = useMutation({
    mutationFn: () =>
      api.listDataset(
        chunks.split('\n').map((chunk) => chunk.trim()).filter(Boolean),
        { title, description },
        Number(priceMist)
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] }),
  });

  const backendPurchase = useMutation({
    mutationFn: (id: string) => api.purchaseDataset(id),
    onSuccess: (data) => setReceiptId(data.receiptId),
  });

  const runTx = async (txFactory: () => any) => {
    if (!account) throw new Error('Connect a Sui testnet wallet first.');
    const res = await signAndExecute({ transaction: txFactory(), account });
    setTxResult(res.digest);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['chain-listings'] }),
      queryClient.invalidateQueries({ queryKey: ['owned-caps', account.address] }),
    ]);
  };

  const blobIdList = blobIds.split(',').map((item) => item.trim()).filter(Boolean);
  const purchaseReceipts = caps.data?.receipts ?? [];

  return (
    <div className="p-10 max-w-6xl mx-auto w-full">
      <div className="flex items-start justify-between gap-6 mb-10">
        <div>
          <h1 className="text-5xl font-bold tracking-tight text-on-surface mb-3">Knowledge Marketplace</h1>
          <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Discover backend-indexed listings, inspect Sui testnet listings, list datasets, buy access, and track receipt objects.
          </p>
        </div>
        <button
          onClick={() => {
            backendListings.refetch();
            chainListings.refetch();
          }}
          className="rounded-lg border border-outline-variant bg-surface-dim px-4 py-3 font-semibold flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <section className="lg:col-span-2 bg-surface-dim border border-outline-variant rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-primary" /> Create Listing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm" placeholder="Title" />
            <input value={priceMist} onChange={(e) => setPriceMist(Number(e.target.value))} type="number" className="rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm" placeholder="Price in MIST" />
            <input value={sealPolicyId} onChange={(e) => setSealPolicyId(e.target.value)} className="rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm font-mono" placeholder="Seal policy ID" />
            <input value={blobIds} onChange={(e) => setBlobIds(e.target.value)} className="rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm font-mono" placeholder="Blob IDs, comma separated" />
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-3 h-20 w-full resize-none rounded-lg border border-outline-variant bg-surface p-4 text-sm" placeholder="Description" />
          <textarea value={chunks} onChange={(e) => setChunks(e.target.value)} className="mt-3 h-28 w-full resize-none rounded-lg border border-outline-variant bg-surface p-4 text-sm" placeholder="Backend listing chunks, one per line" />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => backendList.mutate()}
              disabled={backendList.isPending}
              className="rounded-lg bg-tertiary px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {backendList.isPending ? 'Listing through backend...' : 'List via Backend'}
            </button>
            <button
              onClick={() =>
                runTx(() =>
                  buildListDatasetTx({ title, description, priceMist: Number(priceMist), blobIds: blobIdList, sealPolicyId })
                ).catch((error) => setTxResult(error.message))
              }
              disabled={!account || blobIdList.length === 0}
              className="rounded-lg bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              List On-Chain
            </button>
          </div>
          {backendList.data || backendList.error ? (
            <pre className="mt-4 max-h-36 overflow-auto rounded-lg border border-outline-variant bg-surface p-3 text-xs">
              {JSON.stringify(backendList.data ?? { error: backendList.error.message }, null, 2)}
            </pre>
          ) : null}
        </section>

        <section className="bg-surface-dim border border-outline-variant rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-tertiary" /> Purchase Receipts
          </h2>
          <p className="text-4xl font-bold">{purchaseReceipts.length}</p>
          <p className="mt-2 text-sm text-outline">Owned `PurchaseReceipt` objects on the connected wallet.</p>
          <input
            value={receiptId}
            onChange={(e) => setReceiptId(e.target.value)}
            className="mt-4 w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm font-mono"
            placeholder="Receipt ID for ingest"
          />
          <div className="mt-4 space-y-2">
            {purchaseReceipts.slice(0, 3).map((receipt) => (
              <button
                key={receipt.id}
                onClick={() => setReceiptId(receipt.id)}
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-left font-mono text-xs"
              >
                {formatAddress(receipt.id, 10)}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {listings.map((listing) => (
          <article key={listing.id} className="bg-surface-dim border border-outline-variant rounded-lg p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold">{listing.title}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{listing.description}</p>
              </div>
              <div className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-right">
                <p className="text-[10px] font-mono uppercase tracking-wider text-outline">Price</p>
                <p className="font-mono text-sm">{formatMist(listing.priceMist)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-5">
              <p><span className="text-outline">Listing:</span> <span className="font-mono">{formatAddress(listing.id, 10)}</span></p>
              <p><span className="text-outline">Owner:</span> <span className="font-mono">{formatAddress(listing.owner)}</span></p>
              <p><span className="text-outline">Chunks:</span> {listing.chunkCount}</p>
              <p><span className="text-outline">Status:</span> {listing.isActive ? 'Active' : 'Inactive'}</p>
              <p><span className="text-outline">Backend:</span> {listing.backendSource ? 'Yes' : 'No'}</p>
              <p><span className="text-outline">Contract:</span> {listing.chainSource ? 'Yes' : 'No'}</p>
            </div>
            <div className="mb-5 rounded-lg border border-outline-variant bg-surface p-3">
              <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-outline">Blob IDs</p>
              <p className="font-mono text-xs text-on-surface-variant">{listing.blobIds.join(', ') || '-'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => backendPurchase.mutate(listing.id)}
                disabled={backendPurchase.isPending}
                className="rounded-lg border border-outline-variant bg-surface px-4 py-3 font-semibold flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" /> Backend Buy
              </button>
              <button
                onClick={() => runTx(() => buildPurchaseDatasetTx(listing.id, listing.priceMist)).catch((error) => setTxResult(error.message))}
                disabled={!account || !listing.chainSource || !listing.isActive}
                className="rounded-lg bg-tertiary px-4 py-3 font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Coins className="w-4 h-4" /> Wallet Buy
              </button>
              <button
                onClick={() => runTx(() => buildDelistDatasetTx(listing.id)).catch((error) => setTxResult(error.message))}
                disabled={!account || !listing.chainSource}
                className="rounded-lg bg-error px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                Delist
              </button>
            </div>
            <button
              onClick={() => api.ingestDataset(listing.id, receiptId).then((res) => setTxResult(res.message)).catch((error) => setTxResult(error.message))}
              disabled={!receiptId}
              className="mt-3 w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 font-semibold disabled:opacity-50"
            >
              Ingest via Backend
            </button>
          </article>
        ))}

        {!listings.length ? (
          <div className="rounded-lg border border-outline-variant bg-surface-dim p-6 text-sm text-on-surface-variant">
            <Store className="mb-3 h-6 w-6 text-primary" />
            No marketplace listings returned yet. Backend status: {backendListings.error?.message || 'ok'}.
          </div>
        ) : null}
      </div>

      {(txResult || backendPurchase.data || backendPurchase.error) ? (
        <pre className="mt-6 max-h-40 overflow-auto rounded-lg border border-outline-variant bg-surface-dim p-3 text-xs">
          {JSON.stringify(
            txResult ? { result: txResult } : backendPurchase.data ?? { error: backendPurchase.error?.message },
            null,
            2
          )}
        </pre>
      ) : null}
    </div>
  );
}
