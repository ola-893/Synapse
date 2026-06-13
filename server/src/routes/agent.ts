import { Router } from 'express';
import { startAgentLoop, stopAgentLoop, getAgentStatus, registerAgent } from '../agents/runtime.ts';
import { getPurchases } from '../db/sqlite.ts';

export const agentRouter = Router();

agentRouter.post('/register', async (req, res) => {
  const { ownerPublicKey } = req.body;
  if (!ownerPublicKey) {
    return res.status(400).json({ error: 'ownerPublicKey is required' });
  }
  try {
    const result = await registerAgent({ ownerPublicKey });
    res.json({ message: 'Agent registered successfully', ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

agentRouter.get('/wallet', async (req, res) => {
  const status = await getAgentStatus();
  if (!status.isRegistered) {
    return res.status(404).json({ error: 'No agent wallet found. Register first.' });
  }
  res.json({ publicKey: status.agentAddress });
});

agentRouter.post('/start', (req, res) => {
  try {
    startAgentLoop();
    res.json({ message: 'Agent started' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

agentRouter.post('/stop', (req, res) => {
  try {
    stopAgentLoop();
    res.json({ message: 'Agent stopped' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

agentRouter.get('/status', async (req, res) => {
  res.json(await getAgentStatus());
});

agentRouter.get('/purchases', async (req, res) => {
  try {
    const ownerAddress = req.query.ownerAddress as string;
    if (!ownerAddress) {
      return res.status(400).json({ error: 'ownerAddress query parameter is required' });
    }
    const purchases = await getPurchases(ownerAddress);
    res.json({ purchases });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
