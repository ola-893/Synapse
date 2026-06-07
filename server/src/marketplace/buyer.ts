import { getStorageDriver } from '../walrus/driver.ts';
import { env } from '../config/env.ts';
import { Transaction } from '@mysten/sui/transactions';
import { suiClient, keypair, agentAddress } from '../config/sui.ts';
import { getMemWal } from '../config/memwal.ts';
import { sealDecrypt } from '../seal/decrypt.ts';
import { createSessionKey, buildApprovalTransaction } from '../seal/session.ts';
import { DatasetListing } from './types.ts';

/**
 * Purchases a dataset on-chain.
 */
export async function purchaseDataset(listing: DatasetListing): Promise<string> {
  const tx = new Transaction();
  
  // Split payment coin
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(listing.priceMist)]);

  tx.moveCall({
    target: `${env.SYNAPSE_PACKAGE_ID}::marketplace::purchase_dataset`,
    arguments: [
      tx.object(listing.id),
      paymentCoin,
      tx.object('0x6'), // Clock
    ]
  });

  const { digest } = await suiClient.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair
  });

  const res = await suiClient.waitForTransaction({
    digest,
    options: {
      showEffects: true,
      showEvents: true
    }
  });

  console.log(`[Buyer] Purchased dataset ${listing.id}. TX: ${digest}`);

  // Find the PurchaseReceipt ID in the created objects
  const createdObjects = res.effects?.created || [];
  const receiptRef = createdObjects.find((c: any) => c.owner?.AddressOwner === agentAddress);
  if (!receiptRef) throw new Error("Purchase receipt not found in tx effects");
  
  return receiptRef.reference.objectId;
}

/**
 * Ingests a purchased dataset.
 */
export async function ingestDataset(listing: DatasetListing, receiptId: string) {
  const driver = getStorageDriver(env.STORAGE_DRIVER);
  
  console.log(`[Buyer] Downloading ${listing.blobIds.length} chunks from storage...`);
  const encryptedChunks = await driver.downloadBatch(listing.blobIds);

  console.log(`[Buyer] Creating Seal session key...`);
  const sessionKey = await createSessionKey(agentAddress, keypair);

  console.log(`[Buyer] Building Seal approval PTB using PurchaseReceipt...`);
  const txBytes = await buildApprovalTransaction(listing.id, receiptId, agentAddress, listing.sealPolicyId);

  console.log(`[Buyer] Decrypting chunks...`);
  const plaintextChunks: string[] = [];
  for (const chunk of encryptedChunks) {
    const plaintext = await sealDecrypt(chunk, sessionKey, txBytes);
    plaintextChunks.push(plaintext);
  }

  console.log(`[Buyer] Ingesting knowledge into MemWal...`);
  const memwal = getMemWal(agentAddress);
  for (const text of plaintextChunks) {
    await memwal.remember(text);
  }

  console.log(`[Buyer] Successfully ingested dataset ${listing.id}`);
}
