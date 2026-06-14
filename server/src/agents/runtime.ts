import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import cron from 'node-cron';
import { getActiveListings } from '../marketplace/discovery.ts';
import { purchaseDatasetWithReceipt } from '../marketplace/buyer.ts';
import { saveAgentWallet, getAgentWallet, savePurchase, hasPurchased } from '../db/sqlite.ts';
import type { AgentLogEvent, DatasetListing } from '../marketplace/types.ts';
import { getMemWalClient, agentNamespace, isMemWalConfigured } from '../memory/memwal.ts';
import { synthesizeDataset, evaluateListingWithMemory } from '../memory/synthesizer.ts';
import { sealDecrypt } from '../seal/decrypt.ts';
import { createSessionKey, buildApprovalTransaction } from '../seal/session.ts';
import { env } from '../config/env.ts';

let activeTask: cron.ScheduledTask | null = null;
let lastTickTime: Date | null = null;
let isRunning = false;
let isTickInProgress = false;
let tickCount = 0;

// The active owner connected via the dashboard
let activeOwnerAddress: string | null = null;

import { initializeKeypair } from '../config/sui.ts';

const MAX_LOG_EVENTS = 100;
const logBuffer: Array<AgentLogEvent & { timestamp: string }> = [];

function createEmitter(): (event: AgentLogEvent) => void {
  return (event: AgentLogEvent) => {
    const entry = { ...event, timestamp: new Date().toISOString() };
    logBuffer.push(entry);
    if (logBuffer.length > MAX_LOG_EVENTS) logBuffer.shift();
    console.log(`[Agent] ${event.phase}:`, JSON.stringify(event));
  };
}

export function getAgentLogs(): Array<AgentLogEvent & { timestamp: string }> {
  return [...logBuffer];
}

export async function getActiveAgentKeypair(): Promise<Ed25519Keypair | null> {
  if (!activeOwnerAddress) return null;
  const wallet = await getAgentWallet(activeOwnerAddress);
  if (!wallet) return null;
  // Use initializeKeypair to properly parse the bech32 key string
  return initializeKeypair(wallet.privateKeyStr);
}

async function decryptWithSeal(
  listing: DatasetListing,
  agentKeypair: Ed25519Keypair,
  rawBytes: Uint8Array,
  receiptId: string
): Promise<string> {
  const agentAddress = agentKeypair.getPublicKey().toSuiAddress();
  const sessionKey = await createSessionKey(agentAddress, agentKeypair);
  const txBytes = await buildApprovalTransaction(listing.id, receiptId, agentAddress, listing.sealPolicyId);
  return sealDecrypt(rawBytes, sessionKey, txBytes);
}

async function runActiveAgentTick() {
  if (isTickInProgress) {
    createEmitter()({ phase: 'TICK_COMPLETE', result: 'skipped', reason: 'Previous tick still in progress' });
    return;
  }

  isTickInProgress = true;
  tickCount++;
  console.log(`\n--- [Agent Tick #${tickCount}] Waking up at ${new Date().toISOString()} ---`);
  lastTickTime = new Date();

  try {
    if (!activeOwnerAddress) throw new Error('No active owner set for the runtime.');

    const walletData = await getAgentWallet(activeOwnerAddress);
    if (!walletData) throw new Error('Agent wallet not found in database for owner');

    const agentKeypair = initializeKeypair(walletData.privateKeyStr);
    await executeAgentTick(walletData.agentAddress, agentKeypair, createEmitter());
  } catch (error) {
    console.error('[Agent] Error during tick:', error);
    createEmitter()({ phase: 'TICK_COMPLETE', result: 'error', error: String(error) });
  } finally {
    isTickInProgress = false;
  }
}

export async function executeAgentTick(
  agentAddress: string,
  agentKeypair: Ed25519Keypair,
  emitLog: (event: AgentLogEvent) => void
): Promise<void> {
  const namespace = agentNamespace(agentAddress);
  const memwalEnabled = isMemWalConfigured();
  const listings = await getActiveListings();

  // Phase 1: recall
  let existingMemories: Array<{ text: string; distance: number; blob_id: string }> = [];
  if (memwalEnabled) {
    try {
      const client = getMemWalClient();
      const topicQuery = listings.slice(0, 5).map((listing) => listing.title).join(', ') || 'Synapse marketplace knowledge';
      const recalled = await client.recall({ query: topicQuery, limit: 5, namespace });
      existingMemories = recalled.results;
      emitLog({
        phase: 'RECALL',
        status: existingMemories.length > 0 ? 'memories_found' : 'no_memories',
        count: existingMemories.length,
        preview: existingMemories.map((memory) => memory.text.slice(0, 80)),
      });
    } catch (err) {
      emitLog({ phase: 'RECALL', status: 'error', error: String(err) });
    }
  } else {
    emitLog({ phase: 'RECALL', status: 'disabled', reason: 'MEMWAL_PRIVATE_KEY or MEMWAL_ACCOUNT_ID not set' });
  }

  // Phase 2: evaluate
  if (!listings.length) {
    emitLog({ phase: 'EVALUATE', status: 'no_listings' });
    return;
  }

  let targetListing: DatasetListing | null = null;
  let buyReason = '';

  for (const listing of listings) {
    const listingId = listing.listingId || listing.id;
    const alreadyPurchased = await hasPurchased(agentAddress, listingId);
    if (alreadyPurchased) {
      emitLog({
        phase: 'EVALUATE',
        listing: listing.title,
        decision: 'SKIP',
        reason: 'Already purchased by this agent',
        memoryContext: 'local purchase history',
      });
      continue;
    }

    const { shouldBuy, reason, memoryContext } = await evaluateListingWithMemory(listing, namespace);
    emitLog({
      phase: 'EVALUATE',
      listing: listing.title,
      decision: shouldBuy ? 'BUY' : 'SKIP',
      reason,
      memoryContext,
    });

    if (shouldBuy) {
      targetListing = listing;
      buyReason = reason;
      break;
    }
  }

  if (!targetListing) {
    emitLog({
      phase: 'TICK_COMPLETE',
      result: 'no_action',
      reason: 'All listings evaluated - memory sufficient or no value found',
    });
    return;
  }

  const targetListingId = targetListing.listingId || targetListing.id;
  const targetBlobId = targetListing.blobId || targetListing.blobIds[0] || '';

  // Phase 3: purchase
  emitLog({ phase: 'PURCHASE', listing: targetListing.title, priceMist: targetListing.priceMist, reason: buyReason });
  let txDigest = '';
  let receiptId = '';
  try {
    const purchase = await purchaseDatasetWithReceipt(targetListing, agentKeypair);
    txDigest = purchase.txDigest;
    receiptId = purchase.receiptId;
    emitLog({ phase: 'PURCHASE', status: 'confirmed', txDigest, receiptId });
  } catch (err) {
    emitLog({ phase: 'PURCHASE', status: 'failed', error: String(err) });
    emitLog({ phase: 'TICK_COMPLETE', result: 'purchase_failed', listing: targetListing.title, error: String(err) });
    return;
  }

  // Phase 4: download
  emitLog({ phase: 'DOWNLOAD', blobId: targetBlobId });
  let rawBytes: Uint8Array;
  try {
    const response = await fetch(`${env.WALRUS_AGGREGATOR_URL.replace(/\/$/, '')}/v1/blobs/${targetBlobId}`);
    if (!response.ok) throw new Error(`Walrus HTTP ${response.status}`);
    rawBytes = new Uint8Array(await response.arrayBuffer());
    emitLog({ phase: 'DOWNLOAD', status: 'success', bytes: rawBytes.length });
  } catch (err) {
    emitLog({ phase: 'DOWNLOAD', status: 'failed', error: String(err) });
    await savePurchase(agentAddress, {
      listingId: targetListingId,
      listingTitle: targetListing.title,
      amountMist: targetListing.priceMist,
      receiptId,
      txDigest,
    });
    emitLog({ phase: 'TICK_COMPLETE', result: 'download_failed', listing: targetListing.title, error: String(err) });
    return;
  }

  // Phase 5: decrypt
  let content: string;
  try {
    content = await decryptWithSeal(targetListing, agentKeypair, rawBytes, receiptId);
    emitLog({ phase: 'DECRYPT', status: 'seal_success', chars: content.length });
  } catch {
    content = Buffer.from(rawBytes).toString('utf-8');
    emitLog({ phase: 'DECRYPT', status: 'plaintext_fallback', chars: content.length });
  }

  // Phase 6: synthesize
  emitLog({ phase: 'SYNTHESIZE', listing: targetListing.title });
  const synthesis = await synthesizeDataset(targetListing.title, content);
  emitLog({ phase: 'SYNTHESIZE', status: 'complete', preview: synthesis.slice(0, 150) });

  // Phase 7: remember
  let memoryBlobId: string | undefined;
  if (memwalEnabled) {
    try {
      const client = getMemWalClient();
      const memoryText = `[Dataset: ${targetListing.title}] Key insights: ${synthesis}`;
      emitLog({ phase: 'REMEMBER', status: 'storing', namespace });
      const result = await client.rememberAndWait(memoryText, namespace);
      memoryBlobId = result.blob_id;
      emitLog({
        phase: 'REMEMBER',
        status: 'confirmed',
        blobId: result.blob_id,
        walrusUrl: `https://walruscan.com/testnet/blob/${result.blob_id}`,
        namespace,
        message: 'Memory permanently stored on Walrus. Agent is now smarter.',
      });
    } catch (err) {
      emitLog({ phase: 'REMEMBER', status: 'failed', error: String(err) });
    }
  } else {
    emitLog({ phase: 'REMEMBER', status: 'disabled', reason: 'MemWal not configured' });
  }

  await savePurchase(agentAddress, {
    listingId: targetListingId,
    listingTitle: targetListing.title,
    amountMist: targetListing.priceMist,
    receiptId,
    txDigest,
    memoryBlobId,
  });

  emitLog({
    phase: 'TICK_COMPLETE',
    result: 'knowledge_acquired',
    listing: targetListing.title,
    memoryStored: Boolean(memoryBlobId),
    memoryBlobId,
  });
}

export async function registerAgent(config: { ownerPublicKey: string }): Promise<{ agentAddress: string }> {
  // Check if wallet already exists in the database
  const existingWallet = await getAgentWallet(config.ownerPublicKey);
  
  if (existingWallet) {
    console.log(`[Agent] Found existing wallet for owner: ${config.ownerPublicKey}`);
    activeOwnerAddress = config.ownerPublicKey;
    return { agentAddress: existingWallet.agentAddress };
  }

  console.log(`[Agent] Generating new wallet for owner: ${config.ownerPublicKey}`);
  const newKeypair = new Ed25519Keypair();
  const agentAddress = newKeypair.getPublicKey().toSuiAddress();
  
  // getSecretKey returns the bech32 format starting with suiprivkey1...
  const privateKeyStr = newKeypair.getSecretKey();
  
  // Encrypt and save to DB
  await saveAgentWallet(config.ownerPublicKey, agentAddress, privateKeyStr);
  
  activeOwnerAddress = config.ownerPublicKey;
  return { agentAddress };
}

export async function startAgentLoop(ownerAddress?: string) {
  if (ownerAddress) {
    await registerAgent({ ownerPublicKey: ownerAddress });
  }
  if (!activeOwnerAddress) {
    throw new Error('Register an agent before starting the autonomous loop.');
  }
  if (isRunning) return;
  console.log('Starting Synapse Agent Runtime (1-minute intervals)...');
  
  // Run every minute
  activeTask = cron.schedule('* * * * *', runActiveAgentTick);
  isRunning = true;
  
  // Trigger first tick immediately
  runActiveAgentTick();
}

export function stopAgentLoop() {
  if (!isRunning || !activeTask) return;
  console.log('Stopping Synapse Agent Runtime...');
  activeTask.stop();
  isRunning = false;
}

export async function getAgentStatus() {
  let agentAddress = null;
  if (activeOwnerAddress) {
    const wallet = await getAgentWallet(activeOwnerAddress);
    if (wallet) agentAddress = wallet.agentAddress;
  }

  return {
    isRegistered: agentAddress !== null,
    isRunning,
    agentAddress,
    ownerAddress: activeOwnerAddress,
    lastTickTime,
    tickCount
  };
}
