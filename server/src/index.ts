import express from 'express';
import cors from 'cors';
import { env } from './config/env.ts';
import { agentRouter } from './routes/agent.ts';
import { memoryRouter } from './routes/memory.ts';
import { sealRouter } from './routes/seal.ts';
import { marketplaceRouter } from './routes/marketplace.ts';
import { startAgentLoop } from './agents/runtime.ts';
import { requireX402Payment } from './x402/middleware.ts';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Mount API routes
app.use('/api/agent', agentRouter);
app.use('/api/memory', memoryRouter);
app.use('/api/seal', sealRouter);
app.use('/api/marketplace', marketplaceRouter);

// Example protected route demonstrating x402 integration with flat pricing
app.get('/api/protected/data', requireX402Payment(5000000), (req, res) => {
  res.json({ data: 'Proprietary market alpha data' });
});

// 404 Catch-all to help debug missing routes
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.originalUrl} - Headers:`, req.headers);
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.listen(env.PORT, () => {
  console.log(`Synapse server listening on port ${env.PORT}`);
});
