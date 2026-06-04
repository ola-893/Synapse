import cron from 'node-cron';
import { memwal } from '../config/memwal.ts';
import { negotiatePaywall } from './brain.ts';
import { secureRemember } from '../memwal/manual.ts';

let activeTask: cron.ScheduledTask | null = null;
let lastTickTime: Date | null = null;
let isRunning = false;

/**
 * The core 2-minute agent execution loop, ported from Continuum.
 */
async function executeAgentTick() {
  console.log(`[Agent] Waking up at ${new Date().toISOString()}`);
  lastTickTime = new Date();

  try {
    // 1. RECALL context before execution
    const pastStrategies = await memwal.recall({
      query: "What was the optimal x402 streaming rate for the target API yesterday, and were there any rate-limit failures?",
      topK: 5,
    });
    console.log(`[Agent] Recalled ${pastStrategies.length} memories for context.`);

    // 2. MOCK: Encounter an API paywall
    const apiRequirements = { endpoint: 'https://api.market.data', cost: '0.005 SUI' };

    // 3. EXECUTE: AI Brain decides strategy based on past MemWal context
    const decision = await negotiatePaywall(apiRequirements, pastStrategies);
    console.log(`[Agent] AI Brain decided to ${decision.strategy} at ${decision.negotiatedRate}`);

    // 4. REMEMBER: Store the outcome back to MemWal (public memory)
    const executionLog = `Successfully negotiated x402 stream for API X at ${decision.negotiatedRate}. Latency: 400ms. Strategy: ${decision.strategy}. Reasoning: ${decision.reasoning}`;
    await memwal.rememberAndWait(executionLog);
    console.log('[Agent] Logged execution to MemWal (public).');

    // 5. SECURE REMEMBER: Encrypt sensitive data (Seal) and store via manual pipeline
    const sensitiveLog = `PROPRIETARY ALPHA: Trading signal detected after x402 access. Expected yield 12%.`;
    const secureBlobId = await secureRemember(sensitiveLog);
    console.log(`[Agent] Logged sensitive execution to Walrus with Seal encryption. Blob ID: ${secureBlobId}`);

  } catch (error) {
    console.error('[Agent] Error during tick:', error);
  }
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

export function getAgentStatus() {
  return {
    isRunning,
    lastTickTime,
  };
}
