import { env, hasMemWalCredentials } from './env.ts';

/**
 * MemWal client interface matching the real SDK shape.
 */
export interface IMemWalClient {
  remember(text: string): Promise<{ id: string }>;
  recall(query: string): Promise<string[]>;
  restore(): Promise<void>;
}

/**
 * In-memory fallback that mimics the MemWal API when real credentials
 * are not available. Still demonstrates the pipeline and logs clearly.
 */
class FallbackMemWalClient implements IMemWalClient {
  private store: Map<string, { text: string; timestamp: number }[]> = new Map();
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
    this.store.set(namespace, []);
    console.log(`[MemWal:Fallback] Initialized in-memory store for namespace "${namespace}"`);
  }

  async remember(text: string): Promise<{ id: string }> {
    const entries = this.store.get(this.namespace) || [];
    const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    entries.push({ text, timestamp: Date.now() });
    this.store.set(this.namespace, entries);
    console.log(`[MemWal:Fallback] Stored memory (${id}): "${text.substring(0, 60)}..."`);
    return { id };
  }

  async recall(query: string): Promise<string[]> {
    const entries = this.store.get(this.namespace) || [];
    // Simple keyword matching for fallback — real MemWal does semantic search
    const queryLower = query.toLowerCase();
    const matches = entries
      .filter(e => e.text.toLowerCase().includes(queryLower) || queryLower.split(' ').some(w => e.text.toLowerCase().includes(w)))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map(e => e.text);
    console.log(`[MemWal:Fallback] Recalled ${matches.length} memories for query: "${query.substring(0, 40)}"`);
    return matches;
  }

  async restore(): Promise<void> {
    console.log(`[MemWal:Fallback] Restore is a no-op in fallback mode`);
  }
}

/**
 * Real MemWal client wrapper that delegates to the @mysten-incubation/memwal SDK.
 */
class RealMemWalClient implements IMemWalClient {
  private client: any;
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  async initialize(): Promise<void> {
    try {
      const { MemWal } = await import('@mysten-incubation/memwal');
      this.client = MemWal.create({
        key: env.MEMWAL_DELEGATE_KEY,
        accountId: env.MEMWAL_ACCOUNT_ID,
        serverUrl: env.MEMWAL_SERVER_URL,
        namespace: this.namespace,
      });
      console.log(`[MemWal:Real] Connected to MemWal relayer for namespace "${this.namespace}"`);
    } catch (error) {
      console.error(`[MemWal:Real] Failed to initialize MemWal SDK:`, error);
      throw error;
    }
  }

  async remember(text: string): Promise<{ id: string }> {
    try {
      const job = await this.client.remember(text);
      if (job?.job_id) {
        await this.client.waitForRememberJob(job.job_id);
      }
      console.log(`[MemWal:Real] Stored memory: "${text.substring(0, 60)}..."`);
      return { id: job?.job_id || 'unknown' };
    } catch (error) {
      console.error(`[MemWal:Real] remember() failed:`, error);
      throw error;
    }
  }

  async recall(query: string): Promise<string[]> {
    try {
      const results = await this.client.recall({ query });
      const texts = (results || []).map((r: any) => r.text || r.content || JSON.stringify(r));
      console.log(`[MemWal:Real] Recalled ${texts.length} memories for query: "${query.substring(0, 40)}"`);
      return texts;
    } catch (error) {
      console.error(`[MemWal:Real] recall() failed:`, error);
      return [];
    }
  }

  async restore(): Promise<void> {
    console.log(`[MemWal:Real] Restore initiated for namespace "${this.namespace}"`);
  }
}

// --- Singleton cache ---
const clientCache = new Map<string, IMemWalClient>();

/**
 * Returns a MemWal client for the given agent address.
 * Uses real SDK if credentials are available, otherwise falls back to in-memory.
 */
export function getMemWal(agentAddress: string): IMemWalClient {
  const namespace = `${env.MEMWAL_NAMESPACE}-${agentAddress}`;

  if (clientCache.has(namespace)) {
    return clientCache.get(namespace)!;
  }

  let client: IMemWalClient;

  if (hasMemWalCredentials) {
    const realClient = new RealMemWalClient(namespace);
    // Fire-and-forget initialization — if it fails, methods will throw
    realClient.initialize().catch(err => {
      console.warn(`[MemWal] Real client init failed, recall/remember calls will error:`, err.message);
    });
    client = realClient;
  } else {
    console.log(`[MemWal] No credentials found. Using in-memory fallback (set MEMWAL_DELEGATE_KEY + MEMWAL_ACCOUNT_ID for real mode)`);
    client = new FallbackMemWalClient(namespace);
  }

  clientCache.set(namespace, client);
  return client;
}
