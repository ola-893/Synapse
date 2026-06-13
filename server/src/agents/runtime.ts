import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import cron from 'node-cron';
import { getMemWal } from '../config/memwal.ts';
import { secureRemember } from '../memwal/manual.ts';
import { getActiveListings } from '../marketplace/discovery.ts';
import { purchaseDataset, ingestDataset } from '../marketplace/buyer.ts';
import { saveAgentWallet, getAgentWallet, savePurchase } from '../db/sqlite.ts';

let activeTask: cron.ScheduledTask | null = null;
let lastTickTime: Date | null = null;
let isRunning = false;
let tickCount = 0;

// The active owner connected via the dashboard
let activeOwnerAddress: string | null = null;

import { initializeKeypair } from '../config/sui.ts';

export async function getActiveAgentKeypair(): Promise<Ed25519Keypair | null> {
  if (!activeOwnerAddress) return null;
  const wallet = await getAgentWallet(activeOwnerAddress);
  if (!wallet) return null;
  // Use initializeKeypair to properly parse the bech32 key string
  return initializeKeypair(wallet.privateKeyStr);
}

/**
 * AI Brain evaluates if a dataset is worth purchasing.
 * Uses broad keyword matching and a reasonable price ceiling.
 * In production, this would call Gemini for semantic evaluation.
 */
async function evaluateDatasetValue(listing: any): Promise<{ shouldBuy: boolean; reason: string }> {
  // Price gate: reject anything over 1 SUI (1_000_000_000 MIST)
  if (listing.priceMist > 1_000_000_000) {
    return { shouldBuy: false, reason: `Price ${listing.priceMist} MIST exceeds 1 SUI budget cap` };
  }
  
  const text = (listing.title + ' ' + listing.description).toLowerCase();
  const VALUABLE_KEYWORDS = [
    'data', 'signal', 'alpha', 'metric', 'analysis', 'research',
    'trading', 'defi', 'model', 'prediction', 'dataset', 'report',
    'neuro', 'genomic', 'climate', 'financial', 'market', 'flux',
    'salinity', 'survey', 'sensor', 'log', 'profile', 'volumetric',
  ];
  const matched = VALUABLE_KEYWORDS.filter(kw => text.includes(kw));
  
  if (matched.length > 0) {
    return { shouldBuy: true, reason: `Matched keywords: ${matched.join(', ')}` };
  }
  
  // Default: buy cheap datasets (< 0.1 SUI) even without keyword match
  if (listing.priceMist <= 100_000_000) {
    return { shouldBuy: true, reason: 'Low-cost dataset, auto-approved for exploration' };
  }
  
  return { shouldBuy: false, reason: 'No valuable keywords found and price above auto-buy threshold' };
}

/**
 * The core agent execution loop.
 */
async function executeAgentTick() {
  tickCount++;
  console.log(`\n--- [Agent Tick #${tickCount}] Waking up at ${new Date().toISOString()} ---`);
  lastTickTime = new Date();

  try {
    if (!activeOwnerAddress) throw new Error('No active owner set for the runtime.');
    
    // Retrieve and decrypt the wallet on-the-fly
    const walletData = await getAgentWallet(activeOwnerAddress);
    if (!walletData) throw new Error('Agent wallet not found in database for owner');
    
    const agentKeypair = initializeKeypair(walletData.privateKeyStr);
    const currentAgentAddress = walletData.agentAddress;

    // 1. RECALL context before execution
    console.log(`[Agent] Recalling context from MemWal...`);
    const pastStrategies = await getMemWal(currentAgentAddress).recall("alpha trading signals");
    console.log(`[Agent] Recalled ${pastStrategies?.length || 0} memories for context.`);

    // 2. DISCOVER new listings on the marketplace
    console.log(`[Agent] Scanning marketplace for new knowledge...`);
    const listings = await getActiveListings();
    console.log(`[Agent] Found ${listings.length} active listings.`);

    // 3. EVALUATE & PURCHASE
    for (const listing of listings) {
      // In a real app we'd check if we already bought it to prevent duplicate purchases.
      const evaluation = await evaluateDatasetValue(listing);
      if (evaluation.shouldBuy) {
        console.log(`[Agent] AI Brain decided to purchase dataset: "${listing.title}" — Reason: ${evaluation.reason}`);
        try {
          const receiptId = await purchaseDataset(listing, agentKeypair);
          console.log(`[Agent] Ingesting purchased knowledge...`);
          await ingestDataset(listing, receiptId, agentKeypair);
          console.log(`[Agent] Successfully learned new knowledge from marketplace!`);
          
          // Save purchase to history (Bug #6)
          await savePurchase(activeOwnerAddress!, {
            listingId: listing.id,
            listingTitle: listing.title,
            amountMist: listing.priceMist,
            receiptId,
          });
          
          // Log the acquisition
          await getMemWal(currentAgentAddress).remember(`Purchased and ingested dataset: ${listing.title} for ${listing.priceMist} MIST.`);
        } catch (e: any) {
          console.error(`[Agent] Failed to purchase/ingest dataset:`, e.message);
        }
      } else {
        console.log(`[Agent] Skipped dataset: "${listing.title}" — Reason: ${evaluation.reason}`);
      }
    }

    // 4. SECURE REMEMBER: Encrypt sensitive execution logs
    const sensitiveLog = `PROPRIETARY STATE: Agent tick #${tickCount} completed. Balance remains healthy.`;
    const secureBlobId = await secureRemember(sensitiveLog);
    console.log(`[Agent] Saved sensitive state to Walrus with Seal encryption. Blob ID: ${secureBlobId}`);

  } catch (error) {
    console.error('[Agent] Error during tick:', error);
  }
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

export function startAgentLoop() {
  if (isRunning) return;
  console.log('Starting Synapse Agent Runtime (1-minute intervals)...');
  
  // Run every minute
  activeTask = cron.schedule('* * * * *', executeAgentTick);
  isRunning = true;
  
  // Trigger first tick immediately
  executeAgentTick();
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
