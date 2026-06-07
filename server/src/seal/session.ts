import { SessionKey } from '@mysten/seal';
import { Transaction } from '@mysten/sui/transactions';
import { Keypair } from '@mysten/sui/cryptography';
import { suiClient } from '../config/sui.ts';
import { env } from '../config/env.ts';

/**
 * Creates a short-lived session key for decryption.
 * @param address The address of the user requesting decryption.
 * @param signer The user's keypair to sign the session creation.
 * @returns The initialized SessionKey.
 */
export async function createSessionKey(address: string, signer: Keypair): Promise<SessionKey> {
  return await SessionKey.create({
    address,
    packageId: env.SEAL_PACKAGE_ID,
    ttlMin: 15,
    signer,
    suiClient,
  });
}

/**
 * Builds the transaction block that calls the `seal_approve_purchase` Move function.
 * This is signed locally by the buyer agent (not the server hot wallet) to prove
 * they own the PurchaseReceipt for this listing.
 * 
 * @param listingId The Object ID of the DatasetListing being decrypted.
 * @param receiptId The Object ID of the PurchaseReceipt owned by the buyer.
 * @param buyerAddress The address of the buyer agent.
 * @returns Serialized transaction bytes.
 */
export async function buildApprovalTransaction(
  listingId: string, 
  receiptId: string,
  buyerAddress: string,
  sealPolicyId: string
): Promise<Uint8Array> {
  const tx = new Transaction();
  
  // The sealPolicyId is used as the Seal policy ID
  const idBytes = new TextEncoder().encode(sealPolicyId);
  
  tx.moveCall({
    target: `${env.SYNAPSE_PACKAGE_ID}::marketplace::seal_approve_purchase`,
    arguments: [
      tx.pure.vector('u8', idBytes),
      tx.object(listingId),
      tx.object(receiptId),
    ],
  });

  // Set the sender to the buyer agent, because the PurchaseReceipt is soulbound
  // and the dry-run will fail if the sender isn't the owner.
  tx.setSender(buyerAddress);

  return await tx.build({ client: suiClient });
}
