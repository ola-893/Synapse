// @ts-ignore
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { env } from './env.js';
import { SealClient } from '@mysten/seal';

// Standard Sui Client
export const suiClient = new SuiClient({ url: getFullnodeUrl(env.SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet' | 'localnet') });

// Extended Sui Client with Seal SDK
// 3. Initialize Seal Client
// We extend the base SuiClient with the Seal API
export const sealClient = new SealClient({
  suiClient,
  serverConfigs: [
    { objectId: env.SEAL_KEY_SERVER_1, weight: 1 },
    { objectId: env.SEAL_KEY_SERVER_2, weight: 1 }
  ]
});

// Support both suiprivkey1... and raw hex formats
export function initializeKeypair(privKey: string): Ed25519Keypair {
  if (privKey.startsWith('suiprivkey1')) {
    const { secretKey } = decodeSuiPrivateKey(privKey);
    return Ed25519Keypair.fromSecretKey(secretKey);
  }
  // Fallback to legacy raw hex format
  const rawBytes = Buffer.from(privKey.replace('0x', ''), 'hex');
  return Ed25519Keypair.fromSecretKey(rawBytes);
}

// 2. Initialize Keypair from env
export const keypair = initializeKeypair(env.SUI_PRIVATE_KEY);
export const agentAddress = keypair.getPublicKey().toSuiAddress();
