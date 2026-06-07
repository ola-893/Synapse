import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, Cpu, PauseCircle, PlayCircle, Plus, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { buildDeactivateAgentTx, buildRegisterAgentTx, formatAddress, getOwnedCapabilities } from '../lib/sui';

export function Agents() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [name, setName] = useState('Synapse Agent');
  const [delegate, setDelegate] = useState('');
  const [profileId, setProfileId] = useState('');
  const [txResult, setTxResult] = useState<string | null>(null);

  const status = useQuery({ queryKey: ['agent-status'], queryFn: api.agentStatus, refetchInterval: 5000 });
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

  const agentAdminCap = caps.data?.agentAdminCaps[0]?.id;

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

  return (
    <div className="p-10 max-w-6xl mx-auto w-full">
      <div className="flex items-start justify-between gap-6 mb-10">
        <div>
          <h1 className="text-5xl font-bold tracking-tight text-on-surface mb-3">Agent Registry</h1>
          <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Control the backend agent loop and call the on-chain registry functions with a connected Sui testnet wallet.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => start.mutate()}
            disabled={start.isPending}
            className="bg-tertiary hover:bg-tertiary/90 text-white px-5 py-3 rounded-lg font-medium flex items-center gap-2"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-dim border border-outline-variant p-6 rounded-lg">
          <p className="text-xs font-mono uppercase tracking-widest text-outline mb-2">Runtime State</p>
          <p className="text-4xl font-bold mb-4">{status.data?.isRunning ? 'Running' : 'Stopped'}</p>
          <p className="text-sm text-outline">{status.data?.lastTickTime ? new Date(status.data.lastTickTime).toLocaleString() : 'No tick recorded'}</p>
        </div>
        <div className="bg-surface-dim border border-outline-variant p-6 rounded-lg">
          <p className="text-xs font-mono uppercase tracking-widest text-outline mb-2">Tick Count</p>
          <p className="text-4xl font-bold mb-4">{status.data?.tickCount ?? 0}</p>
          <p className="text-sm text-outline">From `/api/agent/status`</p>
        </div>
        <div className="bg-surface-dim border border-outline-variant p-6 rounded-lg">
          <p className="text-xs font-mono uppercase tracking-widest text-outline mb-2">Admin Capability</p>
          <p className="text-4xl font-bold mb-4">{caps.data?.agentAdminCaps.length ?? 0}</p>
          <p className="text-sm text-outline">{agentAdminCap ? formatAddress(agentAdminCap) : 'Required for registry writes'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface-dim border border-outline-variant rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Register Agent On-Chain
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
              placeholder="Delegate address, defaults to connected wallet"
            />
            <button
              onClick={() => registerAgent().catch((error) => setTxResult(error.message))}
              disabled={!account || !agentAdminCap}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              Register Agent On-Chain
            </button>
            <button
              onClick={() => {
                if (account) {
                  api.registerAgent(account.address).then(res => setTxResult(`Backend Wallet Created: ${res.agentAddress}`)).catch(e => setTxResult(e.message));
                }
              }}
              disabled={!account}
              className="w-full rounded-lg border border-primary text-primary px-4 py-3 font-semibold disabled:opacity-50"
            >
              Initialize Backend Agent Wallet
            </button>
          </div>
        </section>

        <section className="bg-surface-dim border border-outline-variant rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-error" /> Deactivate Agent
          </h2>
          <input
            value={profileId}
            onChange={(event) => setProfileId(event.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm font-mono"
            placeholder="AgentProfile object ID"
          />
          <button
            onClick={() => deactivateAgent().catch((error) => setTxResult(error.message))}
            disabled={!account || !agentAdminCap || !profileId}
            className="mt-3 w-full rounded-lg bg-error px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            Deactivate Profile
          </button>
        </section>
      </div>

      <div className="mt-6 bg-surface-dim border border-outline-variant rounded-lg overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" /> Connected Operator
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
              <td className="py-4 px-6 text-sm text-outline">Agent AdminCap</td>
              <td className="py-4 px-6 font-mono text-sm">{agentAdminCap || 'None found'}</td>
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
