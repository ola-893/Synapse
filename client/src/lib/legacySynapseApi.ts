import { api } from './api';

export type SynapseWallet = {
  address: string;
  seedPhrase: string;
  privateKey: string;
  balance: number;
  toggleLoop: boolean;
  interests: string;
  maxBudgetPurchase: number;
};

export type SynapseAgentLog = {
  id: string;
  timestamp: string;
  action: string;
  type: 'info' | 'success' | 'warning' | 'error';
  details?: string;
};

export type SynapseDatasetListing = {
  id: string;
  title: string;
  category: string;
  price: number;
  description: string;
  encryptedContent: string;
  walrusBlobId: string;
  status: 'Listed' | 'Acquired';
  sellerAddress: string;
  encryptionPasswordPlaintext: string;
  createdAt: string;
  acquiredAt?: string;
  txHash?: string;
};

export async function synapseGetMarketplace(): Promise<SynapseDatasetListing[]> {
  const { listings } = await api.listings();

  return (listings ?? [])
    .filter((l) => l.isActive)
    .map((l) => {
      const firstBlob = l.blobIds?.[0] ?? '';
      return {
        id: l.id,
        title: l.title,
        category: 'All',
        price: l.priceMist,
        description: l.description,
        encryptedContent: '',
        walrusBlobId: firstBlob,
        status: 'Listed',
        sellerAddress: l.owner,
        encryptionPasswordPlaintext: '',
        createdAt: new Date(l.createdAt ?? Date.now()).toISOString(),
        txHash: undefined,
      };
    });
}

export async function synapseBuyMarketplace(id: string): Promise<{ receiptId: string }> {
  return api.purchaseDataset(id);
}

export async function synapseGetWalletPseudo(): Promise<SynapseWallet> {
  const status = await api.agentStatus();

  return {
    address: status.agentAddress ?? 'Not registered',
    seedPhrase: 'Unavailable in current backend build',
    privateKey: 'Unavailable in current backend build',
    balance: 0,
    toggleLoop: status.isRunning,
    interests: '—',
    maxBudgetPurchase: 0,
  };
}

export async function synapseToggleLoop(toggle: boolean): Promise<SynapseWallet> {
  if (toggle) {
    await api.startAgent();
  } else {
    await api.stopAgent();
  }
  return synapseGetWalletPseudo();
}

export async function synapseCommitProfile(_interests: string, _maxBudgetPurchase: number): Promise<SynapseWallet> {
  return synapseGetWalletPseudo();
}

export async function synapseFetchAgentLogs(): Promise<SynapseAgentLog[]> {
  const status = await api.agentStatus();
  const health = status.isRunning ? 'Agent runtime is running.' : 'Agent runtime is stopped.';

  return [
    {
      id: 'synapse-status-1',
      timestamp: new Date().toISOString(),
      action: status.isRunning ? 'STARTED' : 'STOPPED',
      type: status.isRunning ? 'success' : 'warning',
      details: health,
    },
  ];
}

export async function synapseStartAgent() {
  await api.startAgent();
}

export async function synapseStopAgent() {
  await api.stopAgent();
}

