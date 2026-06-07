import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { encrypt, decrypt } from './encryption.ts';

let db: Database | null = null;

export async function initDB() {
  if (db) return db;

  const dbDir = path.join(process.cwd(), 'data');
  import('fs').then(fs => {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  });

  db = await open({
    filename: path.join(dbDir, 'agents.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS agent_wallets (
      owner_address TEXT PRIMARY KEY,
      agent_address TEXT NOT NULL,
      encrypted_private_key TEXT NOT NULL,
      iv TEXT NOT NULL,
      auth_tag TEXT NOT NULL,
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as int))
    )
  `);

  console.log(`[DB] Database initialized successfully`);
  return db;
}

export async function saveAgentWallet(ownerAddress: string, agentAddress: string, privateKeyStr: string) {
  const database = await initDB();
  
  // Encrypt the private key securely before saving
  const encryptedData = encrypt(privateKeyStr);

  await database.run(
    `INSERT OR REPLACE INTO agent_wallets (owner_address, agent_address, encrypted_private_key, iv, auth_tag) 
     VALUES (?, ?, ?, ?, ?)`,
    [ownerAddress, agentAddress, encryptedData.encryptedText, encryptedData.iv, encryptedData.authTag]
  );
  
  console.log(`[DB] Saved encrypted wallet for owner: ${ownerAddress}`);
}

export async function getAgentWallet(ownerAddress: string): Promise<{ agentAddress: string; privateKeyStr: string } | null> {
  const database = await initDB();

  const row = await database.get(
    `SELECT agent_address, encrypted_private_key, iv, auth_tag FROM agent_wallets WHERE owner_address = ?`,
    [ownerAddress]
  );

  if (!row) {
    return null;
  }

  // Decrypt the private key
  const privateKeyStr = decrypt({
    encryptedText: row.encrypted_private_key,
    iv: row.iv,
    authTag: row.auth_tag
  });

  return {
    agentAddress: row.agent_address,
    privateKeyStr
  };
}
