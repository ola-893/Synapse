import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const envSchema = z.object({
  // Sui
  SUI_NETWORK: z.enum(['mainnet', 'testnet', 'devnet', 'localnet']).default('testnet'),
  SUI_PRIVATE_KEY: z.string().default(''),

  // MemWal
  MEMWAL_DELEGATE_KEY: z.string().default(''),
  MEMWAL_ACCOUNT_ID: z.string().default(''),
  MEMWAL_SERVER_URL: z.string().default(''),
  MEMWAL_NAMESPACE: z.string().default('synapse-agent'),

  // Walrus
  WALRUS_PUBLISHER_URL: z.string().url().default('https://publisher.walrus-testnet.walrus.space'),
  WALRUS_AGGREGATOR_URL: z.string().url().default('https://aggregator.walrus-testnet.walrus.space'),

  // Synapse Contracts
  SYNAPSE_PACKAGE_ID: z.string().default('0x_placeholder_synapse_package_id'),
  MARKETPLACE_REGISTRY_ID: z.string().default('0x_placeholder_marketplace_id'),

  // Seal
  SEAL_PACKAGE_ID: z.string().default('0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d'),
  SEAL_KEY_SERVER_1: z.string().default('0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75'),
  SEAL_KEY_SERVER_2: z.string().default('0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8'),

  // AI
  GEMINI_API_KEY: z.string().default(''),

  // Server
  STORAGE_DRIVER: z.enum(['walrus', 'mock']).default('mock'),
  PORT: z.coerce.number().default(3001),
  AUTO_START: z.coerce.boolean().default(false),
});

export const env = envSchema.parse(process.env);

// Helper to check if we're running with real credentials
export const hasMemWalCredentials = Boolean(env.MEMWAL_DELEGATE_KEY && env.MEMWAL_ACCOUNT_ID);
export const hasGeminiKey = Boolean(env.GEMINI_API_KEY);
export const hasRealContracts = !env.SYNAPSE_PACKAGE_ID.includes('placeholder');
