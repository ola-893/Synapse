import { MemWalManual } from '@mysten-incubation/memwal/manual';
import { env } from '../config/env.ts';
import { encryptMemory } from '../seal/encrypt.ts';
import { uploadToWalrus } from '../walrus/upload.ts';

// Manual MemWal client allows us to encrypt locally with custom Seal policies
export const manualMemwal = MemWalManual.create({
  key: env.MEMWAL_DELEGATE_KEY,
  accountId: env.MEMWAL_ACCOUNT_ID,
  sealServerConfigs: [
    { objectId: env.SEAL_KEY_SERVER_1, weight: 1 },
    { objectId: env.SEAL_KEY_SERVER_2, weight: 1 },
  ],
});

/**
 * Executes the full custom encrypted memory pipeline.
 * 1. Generates text embedding
 * 2. Encrypts plaintext via Seal (with custom OperatorCap policy)
 * 3. Uploads ciphertext to Walrus
 * 4. Registers blobId and vector with MemWal relayer
 * 
 * @param plaintext The sensitive agent execution log
 */
export async function secureRemember(plaintext: string) {
  // 1. Generate embedding vector locally
  const vector = await manualMemwal.embed(plaintext);

  // 2. Encrypt locally with Seal and custom Move policy
  const encryptedObject = await encryptMemory(plaintext);

  // 3. Upload to Walrus
  // Serialize the encrypted object to bytes
  const bytesToUpload = new TextEncoder().encode(JSON.stringify(encryptedObject));
  const { blobId } = await uploadToWalrus(bytesToUpload);

  // 4. Register with MemWal Relayer
  await manualMemwal.rememberManual({
    blobId,
    vector,
    namespace: 'synapse-agent-secure',
  });
  
  return blobId;
}

/**
 * Recalls memory blobs matching a query.
 * Note: Decryption happens separately after this step.
 * 
 * @param query The semantic search query
 * @param topK Number of results
 */
export async function secureRecallIds(query: string, topK: number = 5) {
  const queryVector = await manualMemwal.embed(query);
  
  const results = await manualMemwal.recallManual({
    vector: queryVector,
    topK,
    namespace: 'synapse-agent-secure',
  });
  
  return results; // Returns Walrus blobIds that match
}
