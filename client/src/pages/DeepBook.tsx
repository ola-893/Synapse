import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ArrowLeftRight, Coins, Database, LockKeyhole, Send, SlidersHorizontal } from 'lucide-react';
import { api, ApiError, type PaymentRequirements } from '../lib/api';
import { buildPaymentTx, formatAddress, formatMist } from '../lib/sui';

const chartData = [
  { time: '00:00', value: 100 },
  { time: '04:00', value: 120 },
  { time: '08:00', value: 110 },
  { time: '12:00', value: 140 },
  { time: '16:00', value: 130 },
  { time: '20:00', value: 160 },
  { time: '24:00', value: 190 },
];

export function DeepBook() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [protectedRequirements, setProtectedRequirements] = useState<PaymentRequirements | null>(null);
  const [protectedDigest, setProtectedDigest] = useState('');
  const [protectedResult, setProtectedResult] = useState<string | null>(null);
  const [query, setQuery] = useState('What alpha signals are available for Sui liquidity today?');
  const [queryRequirements, setQueryRequirements] = useState<PaymentRequirements | null>(null);
  const [queryDigest, setQueryDigest] = useState('');
  const [queryResult, setQueryResult] = useState<unknown>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const pay = async (requirements: PaymentRequirements, onDigest: (digest: string) => void) => {
    if (!account) throw new Error('Connect a Sui testnet wallet first.');
    const res = await signAndExecute({
      transaction: buildPaymentTx(requirements.recipient, requirements.amountMist),
      account,
    });
    onDigest(res.digest);
    return res.digest;
  };

  const fetchProtectedData = async (digest = protectedDigest) => {
    setBusy('protected');
    try {
      const res = await api.protectedData(digest || undefined);
      setProtectedResult(res.data);
      setProtectedRequirements(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 402 && error.requirements) {
        setProtectedRequirements(error.requirements);
        setProtectedResult('Payment required before proprietary data is released.');
      } else {
        setProtectedResult(error instanceof Error ? error.message : String(error));
      }
    } finally {
      setBusy(null);
    }
  };

  const runMarketplaceQuery = async (digest = queryDigest) => {
    setBusy('query');
    try {
      const res = await api.marketplaceQuery(query, digest || undefined);
      setQueryResult(res);
      setQueryRequirements(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 402 && error.requirements) {
        setQueryRequirements(error.requirements);
        setQueryResult({ message: 'Payment required before marketplace memory query runs.', requirements: error.requirements });
      } else {
        setQueryResult({ error: error instanceof Error ? error.message : String(error) });
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto w-full">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-on-surface mb-2">x402 Market Console</h1>
          <div className="flex items-center gap-2 text-sm text-outline">
            <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse"></div>
            Wallet-paid Sui testnet access for protected Synapse data
          </div>
        </div>
        <div className="bg-surface-dim border border-outline-variant text-on-surface px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 text-sm">
          <SlidersHorizontal className="w-4 h-4" />
          {account ? formatAddress(account.address) : 'Wallet disconnected'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-surface-dim border border-outline-variant rounded-lg p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-mono uppercase tracking-widest text-outline">Protected Query Activity</h3>
            <span className="text-sm font-bold text-[#1474d4]">x402</span>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1474d4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1474d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={['dataMin - 20', 'dataMax + 20']} />
                <Area type="monotone" dataKey="value" stroke="#1474d4" strokeWidth={2} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <section className="bg-surface-dim border border-outline-variant rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <LockKeyhole className="w-5 h-5 text-primary" /> Protected Data
          </h2>
          {protectedRequirements ? (
            <div className="mb-4 rounded-lg border border-outline-variant bg-surface p-3 text-sm">
              <p className="font-semibold">Payment required</p>
              <p>{formatMist(protectedRequirements.amountMist)}</p>
              <p className="font-mono text-xs text-outline">{formatAddress(protectedRequirements.recipient, 10)}</p>
            </div>
          ) : null}
          <input
            value={protectedDigest}
            onChange={(event) => setProtectedDigest(event.target.value)}
            className="mb-3 w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm font-mono"
            placeholder="Payment digest"
          />
          <button
            onClick={() => fetchProtectedData()}
            disabled={busy === 'protected'}
            className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 font-semibold flex items-center justify-center gap-2"
          >
            <Database className="w-4 h-4" /> Request Data
          </button>
          <button
            onClick={() =>
              protectedRequirements &&
              pay(protectedRequirements, setProtectedDigest)
                .then((digest) => fetchProtectedData(digest))
                .catch((error) => setProtectedResult(error.message))
            }
            disabled={!protectedRequirements || !account}
            className="mt-3 w-full rounded-lg bg-tertiary px-4 py-3 font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Coins className="w-4 h-4" /> Pay and Retry
          </button>
          {protectedResult ? <p className="mt-4 rounded-lg bg-surface p-3 text-sm">{protectedResult}</p> : null}
        </section>
      </div>

      <section className="bg-surface-dim border border-outline-variant rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-primary" /> Marketplace Memory Query
        </h2>
        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-24 w-full resize-none rounded-lg border border-outline-variant bg-surface p-4 text-sm"
        />
        {queryRequirements ? (
          <div className="my-4 rounded-lg border border-outline-variant bg-surface p-3 text-sm">
            <p className="font-semibold">Payment required: {formatMist(queryRequirements.amountMist)}</p>
            <p className="font-mono text-xs text-outline">Recipient {queryRequirements.recipient}</p>
          </div>
        ) : null}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
          <input
            value={queryDigest}
            onChange={(event) => setQueryDigest(event.target.value)}
            className="rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm font-mono"
            placeholder="Payment digest"
          />
          <button
            onClick={() => runMarketplaceQuery()}
            disabled={busy === 'query' || !query.trim()}
            className="rounded-lg border border-outline-variant bg-surface px-4 py-3 font-semibold flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Query
          </button>
          <button
            onClick={() =>
              queryRequirements &&
              pay(queryRequirements, setQueryDigest)
                .then((digest) => runMarketplaceQuery(digest))
                .catch((error) => setQueryResult({ error: error.message }))
            }
            disabled={!queryRequirements || !account}
            className="rounded-lg bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Coins className="w-4 h-4" /> Pay
          </button>
        </div>
        {queryResult ? (
          <pre className="mt-5 max-h-72 overflow-auto rounded-lg border border-outline-variant bg-surface p-4 text-xs">
            {JSON.stringify(queryResult, null, 2)}
          </pre>
        ) : null}
      </section>
    </div>
  );
}

export default DeepBook;
