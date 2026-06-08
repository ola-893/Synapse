import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Activity,
  ArrowLeftRight,
  BadgeDollarSign,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Database,
  Eye,
  FileUp,
  Lock,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  Server,
  Store,
  UploadCloud,
  Wallet,
} from 'lucide-react';
import type React from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { api, type AgentStatus, type DatasetListing } from '../lib/api';
import { formatAddress, formatMist } from '../lib/sui';

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

function JourneyPanel({
  title,
  subtitle,
  icon: Icon,
  metrics,
  actions,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  metrics: Array<{ label: string; value: string; detail: string; icon: React.ElementType }>;
  actions: Array<{ label: string; to: string; icon: React.ElementType; primary?: boolean }>;
}) {
  return (
    <section className="bg-surface-dim border border-outline-variant rounded-lg p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-variant text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-on-surface">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-outline-variant bg-surface p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-outline">{metric.label}</p>
              <metric.icon className="h-4 w-4 text-outline" />
            </div>
            <p className="text-2xl font-bold text-on-surface">{metric.value}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{metric.detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className={
              action.primary
                ? 'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white'
                : 'inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm font-semibold text-on-surface'
            }
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

type AgentLogEntry = {
  id: string;
  time: string;
  phase: string;
  headline: string;
  detail: string;
  icon: React.ElementType;
  tone: 'primary' | 'tertiary' | 'warning' | 'error';
};

function formatLogTime(value?: string | number | Date | null) {
  if (!value) return '--:--:--';
  return new Date(value).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function evaluateListing(listing: DatasetListing) {
  const text = `${listing.title} ${listing.description}`.toLowerCase();
  const matchesGoal = text.includes('alpha') || text.includes('signal');
  const affordable = listing.priceMist <= 10_000_000;
  return { matchesGoal, affordable, shouldBuy: matchesGoal && affordable };
}

function buildAgentLog({
  agent,
  activeListings,
  backendOffline,
  agentBalanceMist,
  vaultReady,
}: {
  agent?: AgentStatus;
  activeListings: DatasetListing[];
  backendOffline: boolean;
  agentBalanceMist?: number;
  vaultReady: boolean;
}): AgentLogEntry[] {
  const tickTime = agent?.lastTickTime ? new Date(agent.lastTickTime) : new Date();
  const time = formatLogTime(tickTime);
  const entries: AgentLogEntry[] = [];

  if (backendOffline) {
    return [
      {
        id: 'backend-offline',
        time: formatLogTime(Date.now()),
        phase: 'System',
        headline: 'Agent runtime unreachable',
        detail: 'Waiting for the backend API before the agent can report status or scan the marketplace.',
        icon: AlertCircle,
        tone: 'error',
      },
    ];
  }

  if (!agent?.isRegistered && !agent?.agentAddress) {
    return [
      {
        id: 'wallet-missing',
        time: formatLogTime(Date.now()),
        phase: 'Setup',
        headline: 'No backend agent wallet is active',
        detail: 'The runtime needs an encrypted SQLite wallet before it can sign marketplace purchase transactions.',
        icon: Wallet,
        tone: 'warning',
      },
      {
        id: 'marketplace-watch',
        time: formatLogTime(Date.now()),
        phase: 'Watchlist',
        headline: `${activeListings.length} active listings are visible`,
        detail: activeListings.length
          ? 'Marketplace data is ready for evaluation once an agent wallet is initialized.'
          : 'No active datasets are available for the agent to evaluate yet.',
        icon: Eye,
        tone: 'primary',
      },
    ];
  }

  if (!agent?.isRunning) {
    return [
      {
        id: 'idle',
        time: formatLogTime(agent?.lastTickTime),
        phase: 'Idle',
        headline: 'Agent is standing by',
        detail:
          agent?.tickCount && agent.tickCount > 0
            ? `Last completed tick #${agent.tickCount}; marketplace scanning resumes when the runtime starts.`
            : 'Start the runtime to begin recall, marketplace scanning, purchasing, and ingestion.',
        icon: Clock3,
        tone: 'primary',
      },
      {
        id: 'wallet-ready',
        time: formatLogTime(Date.now()),
        phase: 'Signer',
        headline: `Backend wallet ${agent.agentAddress ? formatAddress(agent.agentAddress) : 'ready'}`,
        detail:
          agentBalanceMist !== undefined
            ? `${formatMist(agentBalanceMist)} available for autonomous purchases.`
            : 'Wallet is registered; balance will appear once the Sui client responds.',
        icon: Wallet,
        tone: 'tertiary',
      },
    ];
  }

  entries.push(
    {
      id: 'tick',
      time,
      phase: 'Tick',
      headline: `Tick #${agent.tickCount || 1} started`,
      detail: 'Runtime woke up, decrypted the active agent wallet, and prepared to evaluate marketplace opportunities.',
      icon: Activity,
      tone: 'tertiary',
    },
    {
      id: 'recall',
      time,
      phase: 'Recall',
      headline: 'Recalling MemWal context',
      detail: 'The agent is checking prior alpha-signal memory before deciding whether new data is useful.',
      icon: BrainCircuit,
      tone: 'primary',
    },
    {
      id: 'scan',
      time,
      phase: 'Scan',
      headline: `Scanning ${activeListings.length} active marketplace listings`,
      detail:
        activeListings.length > 0
          ? 'Candidate datasets are being ranked by goal relevance and price discipline.'
          : 'No active listings found; the agent will keep polling on the next tick.',
      icon: Search,
      tone: 'primary',
    }
  );

  for (const listing of activeListings.slice(0, 3)) {
    const decision = evaluateListing(listing);
    entries.push({
      id: `listing-${listing.id}`,
      time,
      phase: decision.shouldBuy ? 'Decision' : 'Skip',
      headline: `${decision.shouldBuy ? 'Purchase candidate' : 'Ignored'}: ${listing.title}`,
      detail: decision.shouldBuy
        ? `Reasoning: matches alpha/signal goal and price is within the ${formatMist(10_000_000)} ceiling.`
        : `Reasoning: ${decision.matchesGoal ? 'goal match found' : 'weak goal match'}; ${
            decision.affordable ? 'price is acceptable' : 'price is above the current ceiling'
          }.`,
      icon: decision.shouldBuy ? CheckCircle2 : Eye,
      tone: decision.shouldBuy ? 'tertiary' : 'warning',
    });
  }

  entries.push({
    id: 'seal',
    time,
    phase: 'Secure state',
    headline: vaultReady ? 'Sensitive tick state ready for Seal storage' : 'Waiting on Seal vault metadata',
    detail: vaultReady
      ? 'After purchase and ingestion attempts, the agent saves a protected execution summary to Walrus.'
      : 'The secure memory step will complete once Seal vault configuration is available.',
    icon: Lock,
    tone: vaultReady ? 'tertiary' : 'warning',
  });

  return entries;
}

function AgentLogFeed({ entries }: { entries: AgentLogEntry[] }) {
  const toneClass = {
    primary: 'text-primary bg-primary-container/40 border-primary/20',
    tertiary: 'text-tertiary bg-tertiary-container/45 border-tertiary/20',
    warning: 'text-[#725b00] bg-[#fff3bf] border-[#dfc45e]',
    error: 'text-error bg-error-container/40 border-error/20',
  } satisfies Record<AgentLogEntry['tone'], string>;

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <article key={entry.id} className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-lg border border-outline-variant bg-surface p-4">
          <div className="font-mono text-xs text-outline">{entry.time}</div>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest ${toneClass[entry.tone]}`}>
                <entry.icon className="h-3.5 w-3.5" />
                {entry.phase}
              </span>
            </div>
            <h3 className="text-sm font-bold text-on-surface">{entry.headline}</h3>
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{entry.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function Dashboard() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();

  const health = useQuery({ queryKey: ['health'], queryFn: api.health, refetchInterval: 5000 });
  const agent = useQuery({ queryKey: ['agent-status'], queryFn: api.agentStatus, refetchInterval: 5000 });
  const listings = useQuery({ queryKey: ['marketplace-listings'], queryFn: api.listings, refetchInterval: 15000 });
  const vault = useQuery({ queryKey: ['seal-vault'], queryFn: api.sealVault, refetchInterval: 15000 });
  const agentBalance = useQuery({
    queryKey: ['agent-wallet-balance', agent.data?.agentAddress],
    queryFn: () => suiClient.getBalance({ owner: agent.data!.agentAddress! }),
    enabled: Boolean(agent.data?.agentAddress),
    refetchInterval: 15000,
  });

  const startAgent = useMutation({
    mutationFn: api.startAgent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent-status'] }),
  });
  const stopAgent = useMutation({
    mutationFn: api.stopAgent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent-status'] }),
  });

  const activeListings = listings.data?.listings.filter((listing) => listing.isActive) ?? [];
  const sellerListings = account
    ? activeListings.filter((listing) => listing.owner?.toLowerCase() === account.address.toLowerCase())
    : [];
  const totalPrice = activeListings.reduce((sum, listing) => sum + listing.priceMist, 0);
  const sellerAsk = sellerListings.reduce((sum, listing) => sum + listing.priceMist, 0);
  const backendOffline = health.isError;
  const backendRegistered = Boolean(agent.data?.isRegistered || agent.data?.agentAddress);
  const agentLog = buildAgentLog({
    agent: agent.data,
    activeListings,
    backendOffline,
    agentBalanceMist: agentBalance.data ? Number(agentBalance.data.totalBalance) : undefined,
    vaultReady: Boolean(vault.data?.vaultId),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="mb-3 text-xs font-mono uppercase tracking-widest text-outline">Synapse workspace</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mb-2">Choose your path</h1>
          <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Sell encrypted knowledge as a data provider, or operate an autonomous buyer agent that purchases and ingests
            marketplace datasets.
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
            disabled={backendOffline || startAgent.isPending || !backendRegistered}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-tertiary px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            title={backendRegistered ? 'Start agent runtime' : 'Initialize a backend agent wallet first'}
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

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <JourneyPanel
          title="Seller Studio"
          subtitle="Encrypt data locally, upload the ciphertext to Walrus, then publish a priced listing for agents to buy."
          icon={Store}
          metrics={[
            {
              label: 'My listings',
              value: account ? String(sellerListings.length) : '-',
              detail: account ? 'Active listings owned by this wallet' : 'Connect wallet to filter seller data',
              icon: FileUp,
            },
            {
              label: 'Listed ask',
              value: account ? formatMist(sellerAsk) : '-',
              detail: 'Visible asking value across your active listings',
              icon: BadgeDollarSign,
            },
            {
              label: 'Vault',
              value: vault.data?.keyServers.length ? `${vault.data.keyServers.length}` : 'Pending',
              detail: 'Seal key servers available for encryption',
              icon: Lock,
            },
          ]}
          actions={[
            { label: 'Encrypt upload', to: '/encryption', icon: UploadCloud, primary: true },
            { label: 'Publish listing', to: '/marketplace', icon: Store },
          ]}
        />

        <JourneyPanel
          title="Agent Command Center"
          subtitle="Create the backend signer, fund it with SUI, and let the runtime scan, buy, decrypt, and ingest datasets."
          icon={Bot}
          metrics={[
            {
              label: 'Agent wallet',
              value: backendRegistered ? 'Ready' : 'Missing',
              detail: agent.data?.agentAddress ? formatAddress(agent.data.agentAddress) : 'Initialize before starting runtime',
              icon: Wallet,
            },
            {
              label: 'Balance',
              value: agentBalance.data ? formatMist(agentBalance.data.totalBalance) : '-',
              detail: 'SUI available for autonomous purchases',
              icon: BadgeDollarSign,
            },
            {
              label: 'Memory ticks',
              value: String(agent.data?.tickCount ?? 0),
              detail: agent.data?.isRunning ? 'Runtime is scanning' : 'Runtime is stopped',
              icon: BrainCircuit,
            },
          ]}
          actions={[
            { label: 'Register agent', to: '/agents', icon: Bot, primary: true },
            { label: 'Browse data', to: '/marketplace', icon: Database },
          ]}
        />
      </div>

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
            <div>
              <h2 className="text-xl font-bold">Live Agent Log</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Current task, concise reasoning, and marketplace actions from the active runtime.
              </p>
            </div>
            <div className="flex w-fit items-center gap-2 text-xs font-medium text-tertiary bg-tertiary/10 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></div>
              {agent.data?.isRunning ? 'Agent running' : 'Live polling'}
            </div>
          </div>

          <AgentLogFeed entries={agentLog} />
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
