import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ArrowLeftRight,
  Bot,
  Database,
  Lock,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Server,
  ShieldCheck,
} from 'lucide-react';
import type React from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { api } from '../lib/api';
import { formatMist } from '../lib/sui';

const chartData = [
  { time: '00:00', value: 2 },
  { time: '04:00', value: 4 },
  { time: '08:00', value: 3 },
  { time: '12:00', value: 7 },
  { time: '16:00', value: 9 },
  { time: '20:00', value: 12 },
];

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'primary',
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  tone?: 'primary' | 'tertiary' | 'error';
}) {
  const iconColor =
    tone === 'tertiary' ? 'text-tertiary' : tone === 'error' ? 'text-error' : 'text-primary';

  return (
    <div className="bg-surface-dim border border-outline-variant p-6 rounded-lg relative overflow-hidden min-h-[166px]">
      <Icon className={`absolute right-[-8px] top-4 h-24 w-24 opacity-[0.045] ${iconColor}`} />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <p className="text-xs font-mono uppercase tracking-widest text-outline">{label}</p>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <p className="relative z-10 mt-4 text-3xl font-bold font-mono text-on-surface break-words">
        {value}
      </p>
      <p className="relative z-10 mt-3 text-sm text-on-surface-variant">{detail}</p>
    </div>
  );
}

function statusLabel(isError: boolean, hasData: boolean) {
  if (isError) return 'ERROR';
  if (hasData) return 'OK';
  return 'PENDING';
}

export function Dashboard() {
  const queryClient = useQueryClient();

  const health = useQuery({ queryKey: ['health'], queryFn: api.health, refetchInterval: 5000 });
  const agent = useQuery({ queryKey: ['agent-status'], queryFn: api.agentStatus, refetchInterval: 5000 });
  const listings = useQuery({ queryKey: ['marketplace-listings'], queryFn: api.listings, refetchInterval: 15000 });
  const vault = useQuery({ queryKey: ['seal-vault'], queryFn: api.sealVault, refetchInterval: 15000 });

  const startAgent = useMutation({
    mutationFn: api.startAgent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent-status'] }),
  });
  const stopAgent = useMutation({
    mutationFn: api.stopAgent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent-status'] }),
  });

  const activeListings = listings.data?.listings.filter((listing) => listing.isActive) ?? [];
  const totalPrice = activeListings.reduce((sum, listing) => sum + listing.priceMist, 0);
  const backendOffline = health.isError;

  const rows = [
    {
      surface: 'Health',
      endpoint: '/api/health',
      status: statusLabel(health.isError, Boolean(health.data)),
      result: health.error?.message || health.data?.status || '-',
    },
    {
      surface: 'Agent',
      endpoint: '/api/agent/status',
      status: statusLabel(agent.isError, Boolean(agent.data)),
      result: agent.error?.message || (agent.data?.isRunning ? 'running' : 'stopped'),
    },
    {
      surface: 'Marketplace',
      endpoint: '/api/marketplace/listings',
      status: statusLabel(listings.isError, Boolean(listings.data)),
      result: listings.error?.message || `${activeListings.length} listings`,
    },
    {
      surface: 'Seal',
      endpoint: '/api/seal/vault',
      status: statusLabel(vault.isError, Boolean(vault.data)),
      result: vault.error?.message || vault.data?.vaultId?.slice(0, 12) || '-',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mb-2">
            Network Overview
          </h1>
          <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Live status for the Synapse API, agent runtime, marketplace, Seal vault, MemWal, and x402 surfaces.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => queryClient.invalidateQueries()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-dim px-4 py-3 text-sm font-semibold"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => startAgent.mutate()}
            disabled={backendOffline || startAgent.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-tertiary px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            <PlayCircle className="h-4 w-4" />
            Start Agent
          </button>
          <button
            onClick={() => stopAgent.mutate()}
            disabled={backendOffline || stopAgent.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-dim px-4 py-3 text-sm font-semibold disabled:opacity-50"
          >
            <PauseCircle className="h-4 w-4" />
            Stop
          </button>
        </div>
      </div>

      {backendOffline ? (
        <div className="mb-6 rounded-lg border border-error-container bg-error-container/35 p-4 text-sm text-on-surface">
          <strong>Backend offline.</strong> API-backed dashboard cards will stay in an error state until the server is listening on
          `http://localhost:3001`.
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Backend API"
          value={health.data?.status === 'ok' ? 'Online' : health.isError ? 'Offline' : 'Checking'}
          detail={health.data ? new Date(health.data.timestamp).toLocaleTimeString() : health.error?.message || 'Polling /api/health'}
          icon={Server}
          tone={health.isError ? 'error' : 'primary'}
        />
        <StatCard
          label="Agent Runtime"
          value={agent.data?.isRunning ? 'Running' : 'Stopped'}
          detail={`${agent.data?.tickCount ?? 0} ticks executed`}
          icon={Bot}
          tone={agent.data?.isRunning ? 'tertiary' : 'primary'}
        />
        <StatCard
          label="Marketplace"
          value={String(activeListings.length)}
          detail={`Active listings, ${formatMist(totalPrice)} total ask`}
          icon={Database}
        />
        <StatCard
          label="Seal Vault"
          value={vault.data?.keyServers.length ? `${vault.data.keyServers.length} servers` : vault.isError ? 'Offline' : 'Pending'}
          detail={vault.data?.packageId ? `${vault.data.packageId.slice(0, 12)}...` : vault.error?.message || 'Loading vault config'}
          icon={Lock}
          tone={vault.isError ? 'error' : 'tertiary'}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-surface-dim border border-outline-variant rounded-lg p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 border-b border-outline-variant/50 pb-4">
            <h2 className="text-xl font-bold">Integration Activity</h2>
            <div className="flex w-fit items-center gap-2 text-xs font-medium text-tertiary bg-tertiary/10 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></div>
              Live polling
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant text-[11px] font-mono tracking-wider uppercase text-outline">
                  <th className="py-4 font-medium">Surface</th>
                  <th className="py-4 font-medium">Endpoint</th>
                  <th className="py-4 font-medium">Status</th>
                  <th className="py-4 font-medium text-right">Last Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.surface} className="border-b border-outline-variant/40 hover:bg-surface/50">
                    <td className="py-4 text-sm font-semibold">{row.surface}</td>
                    <td className="py-4 font-mono text-sm text-outline">{row.endpoint}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface px-3 py-1 text-[10px] font-mono">
                        {row.status === 'OK' ? (
                          <ShieldCheck className="h-3 w-3 text-tertiary" />
                        ) : (
                          <Activity className="h-3 w-3 text-primary" />
                        )}
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 text-right text-sm font-mono text-on-surface-variant max-w-[220px] truncate">
                      {row.result}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-surface-dim border border-outline-variant rounded-lg p-4 sm:p-6 flex flex-col min-h-[360px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Memory Growth</h2>
            <ArrowLeftRight className="h-5 w-5 text-outline" />
          </div>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="memoryColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#416652" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#416652" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                <Area type="monotone" dataKey="value" stroke="#416652" strokeWidth={2} fill="url(#memoryColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-outline-variant pt-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-outline">Agent ticks</p>
              <p className="mt-1 font-mono text-lg font-bold">{agent.data?.tickCount ?? 0}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono uppercase tracking-widest text-outline">Listings</p>
              <p className="mt-1 font-mono text-lg font-bold text-tertiary">{activeListings.length}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
