import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Coins, RefreshCw, ShoppingCart, Store } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api, type DatasetListing } from '../lib/api';
import {
  buildPurchaseDatasetTx,
  formatAddress,
  formatMist,
  getChainListings,
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

  const listings = useMemo(() => {
    const map = new Map<string, MergedListing>();
    for (const listing of backendListings.data?.listings ?? []) {
      map.set(listing.id, { ...listing, backendSource: true });
    }
    for (const listing of chainListings.data ?? []) {
      map.set(listing.id, { ...map.get(listing.id), ...listing, chainSource: true });
    }
    return [...map.values()].filter((listing) => listing.isActive);
  }, [backendListings.data, chainListings.data]);

  const backendPurchase = useMutation({
    mutationFn: (id: string) => api.purchaseDataset(id),
    onSuccess: (data) => setTxResult(`Purchase complete. Receipt: ${data.receiptId}`),
    onError: (error) => setTxResult(error.message),
  });

  const buyWithWallet = async (listing: MergedListing) => {
    if (!account) throw new Error('Connect a Sui testnet wallet first.');
    const res = await signAndExecute({
      transaction: buildPurchaseDatasetTx(listing.id, listing.priceMist),
      account,
    });
    setTxResult(res.digest);
    await queryClient.invalidateQueries({ queryKey: ['chain-listings'] });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full">
      <div className="mb-8 flex flex-col items-start justify-between gap-6 xl:flex-row">
        <div>
          <p className="mb-3 text-xs font-mono uppercase tracking-widest text-outline">Browse data</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mb-3">Data Marketplace</h1>
          <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Find datasets your agent can buy and learn from. Each listing shows the seller, price, and encrypted storage
            reference.
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {listings.map((listing) => (
          <article key={listing.id} className="bg-surface-dim border border-outline-variant rounded-lg p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold">{listing.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{listing.description}</p>
              </div>
              <div className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-right">
                <p className="text-[10px] font-mono uppercase tracking-wider text-outline">Price</p>
                <p className="font-mono text-sm">{formatMist(listing.priceMist)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 mb-5">
              <p><span className="text-outline">Seller:</span> <span className="font-mono">{formatAddress(listing.owner)}</span></p>
              <p><span className="text-outline">Listing:</span> <span className="font-mono">{formatAddress(listing.id, 10)}</span></p>
              <p><span className="text-outline">Data parts:</span> {listing.chunkCount}</p>
              <p><span className="text-outline">Source:</span> {listing.chainSource ? 'On-chain' : 'Marketplace index'}</p>
            </div>

            <div className="mb-5 rounded-lg border border-outline-variant bg-surface p-3">
              <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-outline">Encrypted storage ID</p>
              <p className="font-mono text-xs text-on-surface-variant break-words">{listing.blobIds.join(', ') || '-'}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={() => backendPurchase.mutate(listing.id)}
                disabled={backendPurchase.isPending}
                className="rounded-lg border border-outline-variant bg-surface px-4 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4" /> Buy for Agent
              </button>
              <button
                onClick={() => buyWithWallet(listing).catch((error) => setTxResult(error.message))}
                disabled={!account || !listing.chainSource || !listing.isActive}
                className="rounded-lg bg-tertiary px-4 py-3 font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Coins className="w-4 h-4" /> Buy with Wallet
              </button>
            </div>
          </article>
        ))}

        {!listings.length ? (
          <div className="rounded-lg border border-outline-variant bg-surface-dim p-6 text-sm text-on-surface-variant">
            <Store className="mb-3 h-6 w-6 text-primary" />
            No datasets are listed yet. Backend status: {backendListings.error?.message || 'ok'}.
          </div>
        ) : null}
      </div>

      {(txResult || backendPurchase.data || backendPurchase.error) ? (
        <pre className="mt-6 max-h-40 overflow-auto rounded-lg border border-outline-variant bg-surface-dim p-3 text-xs">
          {JSON.stringify({ result: txResult ?? backendPurchase.data ?? backendPurchase.error?.message }, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
