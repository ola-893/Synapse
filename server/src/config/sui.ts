import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { seal } from '@mysten/seal';
import { env } from './env.ts';

// Standard Sui Client
export const suiClient = new SuiClient({ url: getFullnodeUrl(env.SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet' | 'localnet') });

// Extended Sui Client with Seal SDK
export const sealClient = new SuiGrpcClient({
  network: env.SUI_NETWORK as 'testnet' | 'mainnet',
  baseUrl: 'https://fullnode.testnet.sui.io:443', // Fallback if needed, typically uses grpc
}).$extend(
  seal({
    serverConfigs: [
      { objectId: env.SEAL_KEY_SERVER_1, weight: 1 },
      { objectId: env.SEAL_KEY_SERVER_2, weight: 1 },
    ],
    verifyKeyServers: true,
  })
);

// Agent Keypair
// Decode hex or base64 key
export const agentKeypair = Ed25519Keypair.fromSecretKey(
  Buffer.from(env.SUI_PRIVATE_KEY.replace('0x', ''), 'hex')
);
