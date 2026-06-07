import { agentAddress } from '../config/sui.ts';
import { Router } from 'express';
import { getMemWal } from '../config/memwal.ts';
import { secureRemember, secureRecallIds } from '../memwal/manual.ts';

export const memoryRouter = Router();

memoryRouter.post('/remember', async (req, res) => {
  try {
    const { text, secure } = req.body;
    if (secure) {
      const blobId = await secureRemember(text);
      res.json({ message: 'Secure memory stored', blobId });
    } else {
      const job = await getMemWal(agentAddress).remember(text);
      res.json({ message: 'Memory stored', job });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

memoryRouter.post('/recall', async (req, res) => {
  try {
    const { query, secure } = req.body;
    if (secure) {
      const blobIds = await secureRecallIds(query);
      res.json({ message: 'Secure blobs found. Decryption required.', blobIds });
    } else {
      const memories = await getMemWal(agentAddress).recall(query);
      res.json({ memories });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

memoryRouter.post('/restore', async (req, res) => {
  try {
    await getMemWal(agentAddress).restore();
    res.json({ message: 'Restore initiated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
