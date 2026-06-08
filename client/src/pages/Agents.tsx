import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Activity,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Copy,
  Cpu,
  Eye,
  Lock,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { api, type AgentStatus, type DatasetListing } from '../lib/api';
import { buildDeactivateAgentTx, buildRegisterAgentTx, formatAddress, formatMist, getOwnedCapabilities } from '../lib/sui';

function SetupStep({
  index,
  title,
  detail,
  complete,
}: {
  index: number;
  title: string;
  detail: string;
  complete: boolean;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-outline-variant bg-surface p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-variant text-sm font-bold">
        {complete ? <CheckCircle2 className="h-5 w-5 text-tertiary" /> : index}
      </div>
      <div>
        <p className="font-semibold text-on-surface">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{detail}</p>
      </div>
    </div>
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
  const time = formatLogTime(agent?.lastTickTime ? new Date(agent.lastTickTime) : Date.now());

  if (backendOffline) {
    return [{
      id: 'backend-offline',
      time,
      phase: 'System',
      headline: 'Agent runtime is offline',
      detail: 'Start the backend before your agent can scan the marketplace or report live activity.',
      icon: AlertCircle,
      tone: 'error',
    }];
  }

  if (!agent?.isRegistered && !agent?.agentAddress) {
    return [
      {
        id: 'wallet-missing',
        time,
        phase: 'Setup',
        headline: 'Create an agent buying wallet',
        detail: 'Your agent needs its own encrypted wallet before it can buy data for you.',
        icon: Wallet,
        tone: 'warning',
      },
      {
        id: 'marketplace-watch',
        time,
        phase: 'Marketplace',
        headline: `${activeListings.length} active datasets available`,
        detail: activeListings.length
          ? 'Once the wallet is ready, the agent can evaluate these listings.'
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
            ? `Last completed run #${agent.tickCount}. Start the agent to resume scanning.`
            : 'Start the agent when you are ready for it to scan, buy, and learn from data.',
        icon: Clock3,
        tone: 'primary',
      },
      {
        id: 'wallet-ready',
        time,
        phase: 'Wallet',
        headline: `Buying wallet ${agent.agentAddress ? formatAddress(agent.agentAddress) : 'ready'}`,
        detail:
          agentBalanceMist !== undefined
            ? `${formatMist(agentBalanceMist)} available for purchases.`
            : 'Wallet is ready; balance will appear when the Sui client responds.',
        icon: Wallet,
        tone: 'tertiary',
      },
    ];
  }

  const entries: AgentLogEntry[] = [
    {
      id: 'tick',
      time,
      phase: 'Running',
      headline: `Agent run #${agent.tickCount || 1}`,
      detail: 'The agent unlocked its buying wallet and started checking the marketplace.',
      icon: Activity,
      tone: 'tertiary',
    },
    {
      id: 'recall',
      time,
      phase: 'Memory',
      headline: 'Checking what it already knows',
      detail: 'The agent reviews prior memory before deciding if a new dataset is useful.',
      icon: BrainCircuit,
      tone: 'primary',
    },
    {
      id: 'scan',
      time,
      phase: 'Scan',
      headline: `Reviewing ${activeListings.length} active datasets`,
      detail: activeListings.length
        ? 'Listings are being compared by topic match and price.'
        : 'No active listings found; the agent will check again on the next run.',
      icon: Search,
      tone: 'primary',
    },
  ];

  for (const listing of activeListings.slice(0, 3)) {
    const decision = evaluateListing(listing);
    entries.push({
      id: `listing-${listing.id}`,
      time,
      phase: decision.shouldBuy ? 'Candidate' : 'Skip',
      headline: `${decision.shouldBuy ? 'May buy' : 'Skipping'}: ${listing.title}`,
      detail: decision.shouldBuy
        ? `Looks relevant and stays under the ${formatMist(10_000_000)} buying limit.`
        : `${decision.matchesGoal ? 'Topic looks relevant' : 'Topic match is weak'}; ${
            decision.affordable ? 'price is acceptable' : 'price is above the current limit'
          }.`,
      icon: decision.shouldBuy ? CheckCircle2 : Eye,
      tone: decision.shouldBuy ? 'tertiary' : 'warning',
    });
  }

  entries.push({
    id: 'secure',
    time,
    phase: 'Protected',
    headline: vaultReady ? 'Saving private activity summary' : 'Waiting for privacy setup',
    detail: vaultReady
      ? 'After buying or skipping data, the agent stores a protected activity summary.'
      : 'Private activity storage will be ready when the Seal vault responds.',
    icon: Lock,
    tone: vaultReady ? 'tertiary' : 'warning',
  });

  return entries;
}

function AgentActivityLog({ entries }: { entries: AgentLogEntry[] }) {
  const toneClass = {
    primary: 'text-primary bg-primary-container/40 border-primary/20',
    tertiary: 'text-tertiary bg-tertiary-container/45 border-tertiary/20',
    warning: 'text-[#725b00] bg-[#fff3bf] border-[#dfc45e]',
    error: 'text-error bg-error-container/40 border-error/20',
  } satisfies Record<AgentLogEntry['tone'], string>;

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <article key={entry.id} className="grid grid-cols-[82px_minmax(0,1fr)] gap-4 rounded-lg border border-outline-variant bg-surface p-4">
          <div className="font-mono text-xs text-outline">{entry.time}</div>
          <div className="min-w-0">
            <span className={`mb-2 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest ${toneClass[entry.tone]}`}>
              <entry.icon className="h-3.5 w-3.5" />
              {entry.phase}
            </span>
            <h3 className="text-sm font-bold text-on-surface">{entry.headline}</h3>
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{entry.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function Agents() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [name, setName] = useState('Synapse Agent');
  const [delegate, setDelegate] = useState('');
  const [profileId, setProfileId] = useState('');
  const [txResult, setTxResult] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address).then(() => {
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    });
  };

  const status = useQuery({ queryKey: ['agent-status'], queryFn: api.agentStatus, refetchInterval: 5000 });
  const health = useQuery({ queryKey: ['health'], queryFn: api.health, refetchInterval: 5000 });
  const listings = useQuery({ queryKey: ['marketplace-listings'], queryFn: api.listings, refetchInterval: 15000 });
  const vault = useQuery({ queryKey: ['seal-vault'], queryFn: api.sealVault, refetchInterval: 15000 });
  const caps = useQuery({
    queryKey: ['owned-caps', account?.address],
    queryFn: () => getOwnedCapabilities(suiClient, account!.address),
    enabled: Boolean(account),
  });

  const start = useMutation({
    mutationFn: api.startAgent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent-status'] }),
  });

  const stop = useMutation({
    mutationFn: api.stopAgent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent-status'] }),
  });

  const initBackendWallet = useMutation({
    mutationFn: () => {
      if (!account) throw new Error('Connect a wallet before initializing the backend agent wallet.');
      return api.registerAgent(account.address);
    },
    onSuccess: async (res) => {
      setTxResult(`Backend agent wallet initialized: ${res.agentAddress}`);
      await queryClient.invalidateQueries({ queryKey: ['agent-status'] });
    },
    onError: (error) => setTxResult(error.message),
  });

  // Auto-reconnect returning users: if wallet is connected but backend has no active owner,
  // automatically call /register to restore the existing wallet from SQLite.
  const autoReconnected = useRef(false);
  useEffect(() => {
    if (
      account &&
      health.isSuccess &&
      status.isSuccess &&
      !status.data?.ownerAddress &&
      !autoReconnected.current &&
      !initBackendWallet.isPending
    ) {
      autoReconnected.current = true;
      initBackendWallet.mutate();
    }
  }, [account, health.isSuccess, status.isSuccess, status.data?.ownerAddress]);

  // Reset auto-reconnect when account changes
  useEffect(() => {
    autoReconnected.current = false;
  }, [account?.address]);

  const agentAdminCap = caps.data?.agentAdminCaps[0]?.id;
  const activeOwnerMatchesWallet = Boolean(
    account &&
      status.data?.ownerAddress &&
      status.data.ownerAddress.toLowerCase() === account.address.toLowerCase()
  );
  const backendRegistered = Boolean(status.data?.agentAddress && activeOwnerMatchesWallet);
  const backendStatusLoading = status.isLoading; // only show loading on initial fetch, not background refetches

  const hasDifferentActiveOwner = Boolean(account && status.data?.ownerAddress && !activeOwnerMatchesWallet);
  const startDisabled = start.isPending || !backendRegistered;
  const activeListings = listings.data?.listings.filter((listing) => listing.isActive) ?? [];
  const agentBalance = useQuery({
    queryKey: ['agent-wallet-balance', status.data?.agentAddress],
    queryFn: () => suiClient.getBalance({ owner: status.data!.agentAddress! }),
    enabled: Boolean(status.data?.agentAddress),
    refetchInterval: 15000,
  });
  const agentLog = buildAgentLog({
    agent: status.data,
    activeListings,
    backendOffline: health.isError,
    agentBalanceMist: agentBalance.data ? Number(agentBalance.data.totalBalance) : undefined,
    vaultReady: Boolean(vault.data?.vaultId),
  });

  const registerAgent = async () => {
    if (!account || !agentAdminCap) throw new Error('Connect a wallet that owns agent_registry::AdminCap.');
    const res = await signAndExecute({
      transaction: buildRegisterAgentTx(agentAdminCap, name, delegate || account.address),
      account,
    });
    setTxResult(res.digest);
  };

  const deactivateAgent = async () => {
    if (!account || !agentAdminCap) throw new Error('Connect a wallet that owns agent_registry::AdminCap.');
    const res = await signAndExecute({
      transaction: buildDeactivateAgentTx(agentAdminCap, profileId),
      account,
    });
    setTxResult(res.digest);
  };

  if (!backendRegistered) {
    if (backendStatusLoading) {
      return (
        <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto w-full">
          <div className="mb-8">
            <p className="mb-3 text-xs font-mono uppercase tracking-widest text-outline">Agent owner</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mb-3">Loading agent status...</h1>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <p className="mb-3 text-xs font-mono uppercase tracking-widest text-outline">Agent owner</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mb-3">
            Create Your Agent
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Your agent needs its own encrypted buying wallet before it can scan the marketplace and buy data for you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="bg-surface-dim border border-outline-variant rounded-lg p-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" /> First-time setup
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              The backend only needs your connected Sui wallet address. It creates or restores an encrypted agent wallet
              for that owner and returns the agent wallet address.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3">
              <SetupStep
                index={1}
                title="Connect your wallet"
                detail={account ? formatAddress(account.address) : 'Use the Connect button to choose the wallet that owns this agent.'}
                complete={Boolean(account)}
              />
              <SetupStep
                index={2}
                title="Create agent"
                detail={
                  account
                    ? 'Creates or restores the encrypted buying wallet for this wallet address.'
                    : 'This unlocks after your wallet is connected.'
                }
                complete={false}
              />
              <SetupStep
                index={3}
                title="Open agent controls"
                detail="Once created, you can fund the wallet, start the agent, and view live activity."
                complete={false}
              />
            </div>

            <div className="mt-6">
              {!account ? (
                <div className="synapse-wallet-button">
                  <ConnectButton
                    connectText={
                      <span className="inline-flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Connect Wallet
                      </span>
                    }
                  />
                </div>
              ) : (
                <button
                  onClick={() => initBackendWallet.mutate()}
                  disabled={initBackendWallet.isPending || health.isError}
                  className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {initBackendWallet.isPending
                    ? 'Creating agent...'
                    : hasDifferentActiveOwner
                      ? 'Use This Wallet for Agent'
                      : 'Create Agent'}
                </button>
              )}
            </div>

            {health.isError ? (
              <p className="mt-4 rounded-lg border border-error-container bg-error-container/35 p-3 text-sm text-on-surface">
                Backend is offline. Start the backend before creating an agent.
              </p>
            ) : null}

            {txResult ? (
              <p className="mt-4 rounded-lg border border-outline-variant bg-surface p-3 font-mono text-xs">
                {txResult}
              </p>
            ) : null}
          </section>

          <aside className="bg-surface-dim border border-outline-variant rounded-lg p-6">
            <h2 className="text-xl font-bold">What gets created?</h2>
            <div className="mt-5 space-y-4 text-sm text-on-surface-variant">
              <div>
                <p className="font-semibold text-on-surface">Owner wallet</p>
                <p className="mt-1">{account ? formatAddress(account.address, 10) : 'Not connected yet'}</p>
              </div>
              <div>
                <p className="font-semibold text-on-surface">Agent buying wallet</p>
                <p className="mt-1">Generated by the backend and encrypted in SQLite.</p>
              </div>
              <div>
                <p className="font-semibold text-on-surface">On-chain profile</p>
                <p className="mt-1">
                  Optional advanced step. It requires an agent profile permission, but the backend agent wallet does not.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full">
      <div className="flex flex-col items-start justify-between gap-6 mb-8 xl:flex-row">
        <div>
          <p className="mb-3 text-xs font-mono uppercase tracking-widest text-outline">Agent owner</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mb-3">
            Agent Wallet
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Create the wallet your agent uses to buy data. Fund it with SUI, start the agent, and it can scan the
            marketplace for useful datasets.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => start.mutate()}
            disabled={startDisabled}
            className="bg-tertiary hover:bg-tertiary/90 text-white px-5 py-3 rounded-lg font-medium flex items-center gap-2"
            title={backendRegistered ? 'Start runtime' : 'Initialize a backend agent wallet first'}
          >
            <PlayCircle className="w-5 h-5" /> Start
          </button>
          <button
            onClick={() => stop.mutate()}
            disabled={stop.isPending}
            className="bg-surface-dim hover:bg-surface-variant border border-outline-variant px-5 py-3 rounded-lg font-medium flex items-center gap-2"
          >
            <PauseCircle className="w-5 h-5" /> Stop
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface-dim border border-outline-variant p-6 rounded-lg">

          <p className="text-xs font-mono uppercase tracking-widest text-outline mb-2">Runtime State</p>
          <p className="text-2xl font-bold mb-4">{status.data?.isRunning ? 'Running' : 'Stopped'}</p>
          <p className="text-sm text-outline">{status.data?.lastTickTime ? new Date(status.data.lastTickTime).toLocaleString() : 'No tick recorded'}</p>
        </div>
        <div className="bg-surface-dim border border-outline-variant p-6 rounded-lg">
          <p className="text-xs font-mono uppercase tracking-widest text-outline mb-2">Agent Wallet</p>
          <p className="text-2xl font-bold mb-4">{backendRegistered ? 'Ready' : 'Missing'}</p>

          <p className="text-sm font-mono text-outline flex items-center gap-2">
            {status.data?.agentAddress ? (
              <>
                {formatAddress(status.data.agentAddress)}
                <button
                  onClick={() => handleCopy(status.data!.agentAddress!)}
                  className="inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-surface-variant transition-colors"
                  title="Copy agent wallet address"
                >
                  {copiedAddress === status.data!.agentAddress ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-tertiary" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-outline" />
                  )}
                </button>
              </>
            ) : (
              'Create one before Start'
            )}
          </p>
        </div>

        <div className="bg-surface-dim border border-outline-variant p-6 rounded-lg">
          <p className="text-xs font-mono uppercase tracking-widest text-outline mb-2">Wallet Balance</p>
          <p className="text-2xl font-bold mb-4">{agentBalance.data ? `${formatMist(agentBalance.data.totalBalance)}` : '--'}</p>
          <p className="text-sm text-outline">Available for agent purchases</p>
        </div>

        <div className="bg-surface-dim border border-outline-variant p-6 rounded-lg">
          <p className="text-xs font-mono uppercase tracking-widest text-outline mb-2">Memory Growth</p>

          <p className="text-2xl font-bold mb-4">{status.data?.tickCount ?? 0}</p>
          <p className="text-sm text-outline">Agent ticks executed by the runtime</p>
        </div>
      </div>

      <section className="mb-8 bg-surface-dim border border-outline-variant rounded-lg p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-3 border-b border-outline-variant/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Agent Activity</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              A plain-language view of what your agent is doing and why.
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 text-xs font-medium text-tertiary bg-tertiary/10 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></div>
            {status.data?.isRunning ? 'Agent running' : 'Live status'}
          </div>
        </div>
        <AgentActivityLog entries={agentLog} />
      </section>

      {/* <section className="mb-8 bg-surface-dim border border-outline-variant rounded-lg p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" /> Optional public profile
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
              Your backend agent wallet is active. These extra on-chain profile controls are only needed when you want a
              public agent profile and have the required profile permission.
            </p>
          </div>
          <span className="rounded-full border border-outline-variant bg-surface px-3 py-1 text-xs font-mono">
            BACKEND READY
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <SetupStep
            index={1}
            title="Connect your wallet"
            detail={account ? formatAddress(account.address) : 'Connect the Sui wallet that owns this agent.'}
            complete={Boolean(account)}
          />
          <SetupStep
            index={2}
            title="Agent buying wallet"
            detail={status.data?.agentAddress ? formatAddress(status.data.agentAddress) : 'Created by the backend.'}
            complete={backendRegistered}
          />
          <SetupStep
            index={3}
            title="Public profile permission"
            detail={agentAdminCap ? 'Permission detected for on-chain profile writes.' : 'Optional; requires an agent profile permission.'}
            complete={Boolean(agentAdminCap)}
          />
        </div>
      </section> */}

      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface-dim border border-outline-variant rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Advanced: On-Chain Profile
          </h2>
          <div className="space-y-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm"
              placeholder="Agent name"
            />
            <input
              value={delegate}
              onChange={(event) => setDelegate(event.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm font-mono"
              placeholder="Manager address, defaults to connected wallet"
            />
            <button
              onClick={() => registerAgent().catch((error) => setTxResult(error.message))}
              disabled={!account || !agentAdminCap}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              Create On-Chain Profile
            </button>
          </div>
        </section>

        <section className="bg-surface-dim border border-outline-variant rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-error" /> Advanced: Deactivate Profile
          </h2>
          <input
            value={profileId}
            onChange={(event) => setProfileId(event.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm font-mono"
            placeholder="Agent profile ID"
          />
          <button
            onClick={() => deactivateAgent().catch((error) => setTxResult(error.message))}
            disabled={!account || !agentAdminCap || !profileId}
            className="mt-3 w-full rounded-lg bg-error px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            Deactivate Profile
          </button>
        </section>
      </div> */}

      <div className="mt-6 bg-surface-dim border border-outline-variant rounded-lg overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" /> Wallet Details
          </h2>
          <Cpu className="w-5 h-5 text-outline" />
        </div>
        <table className="w-full text-left border-collapse">
          <tbody>
            <tr className="border-b border-outline-variant">
              <td className="py-4 px-6 text-sm text-outline">Wallet</td>
              <td className="py-4 px-6 font-mono text-sm">{account?.address || 'Not connected'}</td>
            </tr>
            <tr className="border-b border-outline-variant">
              <td className="py-4 px-6 text-sm text-outline">Agent profile permission</td>
              <td className="py-4 px-6 font-mono text-sm">{agentAdminCap || 'None found'}</td>
            </tr>
            <tr className="border-b border-outline-variant">
              <td className="py-4 px-6 text-sm text-outline">Agent buying wallet</td>
              <td className="py-4 px-6 font-mono text-sm">
                {status.data?.agentAddress ? (
                  <span className="flex items-center gap-2">
                    {status.data.agentAddress}
                    <button
                      onClick={() => handleCopy(status.data!.agentAddress!)}
                      className="inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-surface-variant transition-colors"
                      title="Copy agent wallet address"
                    >
                      {copiedAddress === status.data!.agentAddress ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-tertiary" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-outline" />
                      )}
                    </button>
                  </span>
                ) : (
                  'Not initialized'
                )}
              </td>
            </tr>
            <tr className="border-b border-outline-variant">
              <td className="py-4 px-6 text-sm text-outline">Owner Address</td>
              <td className="py-4 px-6 font-mono text-sm">{status.data?.ownerAddress || 'No active owner'}</td>
            </tr>
            <tr>
              <td className="py-4 px-6 text-sm text-outline">Last Transaction</td>
              <td className="py-4 px-6 font-mono text-sm">{txResult || 'No transaction submitted'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Agents;
