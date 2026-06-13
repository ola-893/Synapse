import { API_BASE_URL } from './config';

export type HealthResponse = {
  status: string;
  timestamp: number;
};

export type AgentStatus = {
  isRunning: boolean;
  isRegistered?: boolean;
  lastTickTime: string | null;
  tickCount: number;
  ownerAddress?: string | null;
  agentAddress?: string | null;
};

export type DatasetListing = {
  id: string;
  listingId?: string;
  owner: string;
  sellerAddress?: string;
  title: string;
  description: string;
  priceMist: number;
  blobId?: string;
  blobIds: string[];
  chunkCount: number;
  sealPolicyId: string;
  isActive: boolean;
  createdAt: number;
};

export type PaymentRequirements = {
  amountMist: number;
  token: 'SUI';
  recipient: string;
};

type ApiErrorPayload = {
  error?: string;
  requirements?: PaymentRequirements;
};

export class ApiError extends Error {
  status: number;
  requirements?: PaymentRequirements;

  constructor(message: string, status: number, requirements?: PaymentRequirements) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.requirements = requirements;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const payload = data as ApiErrorPayload;
    throw new ApiError(payload.error || res.statusText, res.status, payload.requirements);
  }

  return data as T;
}

export const api = {
  health: () => request<HealthResponse>('/api/health'),
  protectedData: (digest?: string) =>
    request<{ data: string }>('/api/protected/data', {
      headers: digest ? { 'x-sui-payment-digest': digest } : undefined,
    }),

  agentStatus: () => request<AgentStatus>('/api/agent/status'),
  startAgent: () => request<{ message: string }>('/api/agent/start', { method: 'POST' }),
  stopAgent: () => request<{ message: string }>('/api/agent/stop', { method: 'POST' }),
  registerAgent: (ownerPublicKey: string) => 
    request<{ message: string; agentAddress: string }>('/api/agent/register', { 
      method: 'POST', body: JSON.stringify({ ownerPublicKey }) 
    }),
  getAgentWallet: () => request<{ publicKey: string }>('/api/agent/wallet'),

  remember: (text: string, secure: boolean) =>
    request<{ message: string; job?: unknown; blobId?: string }>('/api/memory/remember', {
      method: 'POST',
      body: JSON.stringify({ text, secure }),
    }),
  recall: (query: string, secure: boolean) =>
    request<{ memories?: unknown[]; message?: string; blobIds?: string[] }>('/api/memory/recall', {
      method: 'POST',
      body: JSON.stringify({ query, secure }),
    }),
  restoreMemory: () => request<{ message: string }>('/api/memory/restore', { method: 'POST' }),

  sealVault: () =>
    request<{ vaultId: string; packageId: string; keyServers: string[] }>('/api/seal/vault'),
  sealEncrypt: (text: string, listingId?: string) =>
    request<{ encrypted: Record<string, number> | number[] | string }>('/api/seal/encrypt', {
      method: 'POST',
      body: JSON.stringify({ text, listingId }),
    }),

  listings: () => request<{ listings: DatasetListing[] }>('/api/marketplace/listings'),
  listing: (id: string) => request<{ listing: DatasetListing }>(`/api/marketplace/listings/${id}`),
  listDataset: (blobIds: string[], policyId: string, metadata: { title: string; description: string }, priceMist: number) =>
    request<{ message: string; listingId: string }>('/api/marketplace/list', {
      method: 'POST',
      body: JSON.stringify({ blobIds, policyId, metadata, priceMist }),
    }),
  indexListing: (data: { digest: string; blobId: string; policyId: string; title: string; description: string; priceMist: number; sellerAddress: string }) =>
    request<{ success: boolean; listingId: string }>('/api/marketplace/list', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  purchaseDataset: (id: string) =>
    request<{ message: string; receiptId: string }>(`/api/marketplace/purchase/${id}`, {
      method: 'POST',
    }),
  ingestDataset: (id: string, receiptId: string, digest?: string) =>
    request<{ message: string }>(`/api/marketplace/ingest/${id}`, {
      method: 'POST',
      headers: digest ? { 'x-sui-payment-digest': digest } : undefined,
      body: JSON.stringify({ receiptId }),
    }),
  marketplaceQuery: (query: string, digest?: string) =>
    request<{ answer: string; context: unknown[] }>('/api/marketplace/query', {
      method: 'POST',
      headers: digest ? { 'x-sui-payment-digest': digest } : undefined,
      body: JSON.stringify({ query }),
    }),
};
