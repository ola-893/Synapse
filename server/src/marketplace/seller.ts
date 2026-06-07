import { getStorageDriver } from '../walrus/driver.ts';
import { sealEncrypt } from '../seal/encrypt.ts';
import { env } from '../config/env.ts';
import { Transaction } from '@mysten/sui/transactions';
import { suiClient, keypair } from '../config/sui.ts';
import { v4 as uuidv4 } from 'uuid';
import { ListingMetadata } from './types.ts';

export async function listDataset(chunks: string[], metadata: ListingMetadata, priceInMist: number): Promise<string> {
  const listingId = uuidv4();
  const driver = getStorageDriver(env.STORAGE_DRIVER);
  const encryptedChunks: Uint8Array[] = [];

  // 1. Encrypt each chunk using Seal
  for (const chunk of chunks) {
    const encryptedBytes = await sealEncrypt(chunk, listingId);
    encryptedChunks.push(encryptedBytes);
  }

  // 2. Upload to Walrus via Driver
  const blobIds = await driver.uploadBatch(encryptedChunks);
  const blobIdBytes = blobIds.map(id => Array.from(new TextEncoder().encode(id)));

  // 3. Register on-chain
  const tx = new Transaction();
  const titleBytes = new TextEncoder().encode(metadata.title);
  const descBytes = new TextEncoder().encode(metadata.description);
  const policyBytes = new TextEncoder().encode(listingId);

  // Convert blob IDs to a nested vector format expected by Move
  const blobIdsArg = tx.makeMoveVec({
    elements: blobIdBytes.map(bytes => tx.pure.vector('u8', bytes))
  });

  tx.moveCall({
    target: `${env.SYNAPSE_PACKAGE_ID}::marketplace::list_dataset`,
    arguments: [
      tx.pure.string(metadata.title),
      tx.pure.string(metadata.description),
      tx.pure.u64(priceInMist),
      blobIdsArg,
      tx.pure.u64(chunks.length),
      tx.pure.vector('u8', policyBytes),
      tx.object('0x6'), // Clock object
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

  const event = res.events?.find((e: any) => e.type.includes('DatasetListed'));
  if (!event) throw new Error("Listing event not found in transaction");
  const listingObjectId = (event as any).parsedJson?.listing_id;

  console.log(`[Seller] Listed dataset on-chain. TX: ${digest}, Listing ID: ${listingObjectId}`);
  return listingObjectId;
}
