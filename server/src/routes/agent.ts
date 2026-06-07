import { Router } from 'express';
import { startAgentLoop, stopAgentLoop, getAgentStatus, registerAgent } from '../agents/runtime.ts';

export const agentRouter = Router();

agentRouter.post('/register', (req, res) => {
  registerAgent(req.body);
  res.json({ message: 'Agent registered successfully' });
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

agentRouter.get('/status', (req, res) => {
  res.json(getAgentStatus());
});
