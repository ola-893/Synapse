import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import cron from 'node-cron';
import { getMemWal } from '../config/memwal.ts';
import { secureRemember } from '../memwal/manual.ts';
import { getActiveListings } from '../marketplace/discovery.ts';
import { purchaseDataset, ingestDataset } from '../marketplace/buyer.ts';
import { saveAgentWallet, getAgentWallet } from '../db/sqlite.ts';

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
 * AI Brain evaluates if a dataset is worth purchasing based on its description and price.
 */
async function evaluateDatasetValue(listing: any): Promise<boolean> {
  // Mock decision logic: AI deems datasets < 0.01 SUI valuable if they contain "alpha" or "signal"
  if (listing.priceMist > 10000000) return false;
  const text = (listing.title + ' ' + listing.description).toLowerCase();
  return text.includes('alpha') || text.includes('signal');
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
      const isValuable = await evaluateDatasetValue(listing);
      if (isValuable) {
        console.log(`[Agent] AI Brain decided to purchase dataset: "${listing.title}"`);
        try {
          const receiptId = await purchaseDataset(listing, agentKeypair);
          console.log(`[Agent] Ingesting purchased knowledge...`);
          await ingestDataset(listing, receiptId, agentKeypair);
          console.log(`[Agent] Successfully learned new knowledge from marketplace!`);
          
          // Log the acquisition
          await getMemWal(currentAgentAddress).remember(`Purchased and ingested dataset: ${listing.title} for ${listing.priceMist} MIST.`);
        } catch (e: any) {
          console.error(`[Agent] Failed to purchase/ingest dataset:`, e.message);
        }
      } else {
        console.log(`[Agent] Ignored dataset: "${listing.title}" (not valuable enough)`);
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
  console.log('Starting Synapse Agent Runtime (2-minute intervals)...');
  
  // Run every 2 minutes
  activeTask = cron.schedule('*/2 * * * *', executeAgentTick);
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
