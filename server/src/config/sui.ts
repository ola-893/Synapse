// @ts-ignore
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { env } from './env.js';
import { SealClient } from '@mysten/seal';

// Standard Sui Client
const getBaseUrl = (network: string) => {
  if (network === 'mainnet') return 'https://fullnode.mainnet.sui.io:443';
  if (network === 'devnet') return 'https://fullnode.devnet.sui.io:443';
  if (network === 'localnet') return 'http://127.0.0.1:9000';
  return 'https://fullnode.testnet.sui.io:443'; // default testnet
};

export const suiClient = new SuiJsonRpcClient({ 
  network: env.SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet' | 'localnet',
  url: getBaseUrl(env.SUI_NETWORK)
});

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
  if (!privKey) {
    console.warn('[Warning] No SUI_PRIVATE_KEY provided. Using ephemeral keypair for local testing.');
    return new Ed25519Keypair();
  }
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
