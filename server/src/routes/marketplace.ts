import { Router } from 'express';
import { listDataset } from '../marketplace/seller.ts';
import { purchaseDataset, ingestDataset } from '../marketplace/buyer.ts';
import { getActiveListings, getListingById } from '../marketplace/discovery.ts';
import { requireX402Payment } from '../x402/middleware.ts';
import { getMemWal } from '../config/memwal.ts';
import { agentAddress } from '../config/sui.ts';

export const marketplaceRouter = Router();

// Seller Routes
marketplaceRouter.post('/list', async (req, res) => {
  try {
    const { chunks, metadata, priceMist } = req.body;
    if (!chunks || !metadata || typeof priceMist !== 'number') {
      return res.status(400).json({ error: 'Missing chunks, metadata, or priceMist' });
    }
    const listingId = await listDataset(chunks, metadata, priceMist);
    res.json({ message: 'Dataset listed successfully', listingId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Discovery Routes
marketplaceRouter.get('/listings', async (req, res) => {
  try {
    const listings = await getActiveListings();
    res.json({ listings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketplaceRouter.get('/listings/:id', async (req, res) => {
  try {
    const listing = await getListingById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json({ listing });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buyer Routes
marketplaceRouter.post('/purchase/:id', async (req, res) => {
  try {
    const listing = await getListingById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    
    const receiptId = await purchaseDataset(listing);
    res.json({ message: 'Dataset purchased successfully', receiptId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Protected Ingest Route (requires x402 payment proof)
// This is an example of an endpoint that a third party might call to trigger the agent to ingest
marketplaceRouter.post('/ingest/:id', requireX402Payment(), async (req, res) => {
  try {
    const { receiptId } = req.body;
    if (!receiptId) return res.status(400).json({ error: 'Missing receiptId' });

    const listing = await getListingById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    await ingestDataset(listing, receiptId);
    res.json({ message: 'Dataset ingested successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Protected Query Route (requires x402 payment proof)
marketplaceRouter.post('/query', requireX402Payment(1000000), async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    // Call MemWal recall
    const memwal = getMemWal(agentAddress);
    const context = await memwal.recall(query);
    
    // In a full implementation, we'd pass context to Gemini here.
    // For now, return the raw context.
    res.json({ answer: `Synthesized answer for: ${query}`, context });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
