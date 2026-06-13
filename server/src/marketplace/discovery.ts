import { suiClient } from '../config/sui.ts';
import { env, hasRealContracts } from '../config/env.ts';
import { DatasetListing } from './types.ts';
import { getCachedListings, saveCachedListing, clearCachedListings } from '../db/sqlite.ts';

const MOCK_LISTING: DatasetListing = {
  id: "mock_listing_id_1",
  listingId: "mock_listing_id_1",
  owner: "0x123",
  sellerAddress: "0x123",
  title: "DeFi Alpha Signals (May 2026)",
  description: "Proprietary trading signals backtested on Sui DEXs.",
  priceMist: 5000000, // 0.005 SUI
  blobId: "blob_1",
  blobIds: ["blob_1", "blob_2"],
  chunkCount: 2,
  sealPolicyId: "mock_policy_id_1",
  isActive: true,
  createdAt: Date.now(),
};

function decodeTextBytes(value: any): string {
  if (Array.isArray(value)) return new TextDecoder().decode(new Uint8Array(value.map(Number)));
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function decodeHexBytes(value: any): string {
  if (Array.isArray(value)) {
    return value.map((byte: any) => Number(byte).toString(16).padStart(2, '0')).join('');
  }
  if (typeof value === 'string') return value.replace(/^0x/, '');
  return '';
}

/**
 * Browses all active marketplace listings.
 */
export async function getActiveListings(): Promise<DatasetListing[]> {
  const cachedListings = await getCachedListings();

  if (!hasRealContracts) {
    console.log(`[Discovery] No real contracts, returning mock data`);
    return cachedListings.length ? cachedListings : [MOCK_LISTING];
  }

  console.log(`[Discovery] Querying active listings from marketplace...`);
  try {
    const events = await suiClient.queryEvents({
      query: { MoveEventType: `${env.SYNAPSE_PACKAGE_ID}::marketplace::DatasetListed` },
      limit: 50,
      order: 'descending'
    });
    
    const objectIds = events.data.map((e: any) => (e.parsedJson as any).listing_id);
    if (objectIds.length === 0) return cachedListings;

    const objects = await suiClient.multiGetObjects({
      ids: objectIds,
      options: { showContent: true }
    });

    const listings: DatasetListing[] = [];
    for (const obj of objects) {
      if (obj.data?.content?.dataType === 'moveObject') {
        const fields = obj.data.content.fields as any;
        if (fields.is_active) {
          listings.push({
            id: obj.data.objectId,
            listingId: obj.data.objectId,
            owner: fields.owner,
            sellerAddress: fields.owner,
            title: fields.title,
            description: fields.description,
            priceMist: Number(fields.price_mist),
            blobId: fields.blob_ids.map(decodeTextBytes)[0] || '',
            blobIds: fields.blob_ids.map(decodeTextBytes),
            chunkCount: Number(fields.chunk_count),
            sealPolicyId: decodeHexBytes(fields.seal_policy_id),
            isActive: fields.is_active,
            createdAt: Number(fields.created_at)
          });
        }
      }
    }
    
    const merged = new Map<string, DatasetListing>();
    for (const listing of cachedListings) merged.set(listing.id, listing);
    for (const listing of listings) merged.set(listing.id, listing);
    return [...merged.values()];
  } catch (err) {
    console.error(`[Discovery] Failed to query listings:`, err);
    return cachedListings;
  }
}

export async function getListingById(listingId: string): Promise<DatasetListing | null> {
  if (listingId === "mock_listing_id_1" || !hasRealContracts) return MOCK_LISTING;

  const obj = await suiClient.getObject({
    id: listingId,
    options: { showContent: true }
  });

  if (obj.data?.content?.dataType === 'moveObject') {
    const fields = obj.data.content.fields as any;
    return {
      id: obj.data.objectId,
      listingId: obj.data.objectId,
      owner: fields.owner,
      sellerAddress: fields.owner,
      title: fields.title,
      description: fields.description,
      priceMist: Number(fields.price_mist),
      blobId: fields.blob_ids.map(decodeTextBytes)[0] || '',
      blobIds: fields.blob_ids.map(decodeTextBytes),
      chunkCount: Number(fields.chunk_count),
      sealPolicyId: decodeHexBytes(fields.seal_policy_id),
      isActive: fields.is_active,
      createdAt: Number(fields.created_at)
    };
  }
  return null;
}

export async function getPrice(listingId: string): Promise<number> {
  const listing = await getListingById(listingId);
  return listing?.priceMist || 5000000; 
}

export async function getSeller(listingId: string): Promise<string> {
  const listing = await getListingById(listingId);
  return listing?.owner || "0x123";
}

/**
 * Syncs listings from on-chain DatasetListed events into the local SQLite cache.
 * Clears stale entries first, then re-populates with the real seller address.
 */
export async function syncListingsFromChain(): Promise<void> {
  if (!hasRealContracts) {
    console.log('[sync] No real contracts configured, skipping chain sync');
    return;
  }

  console.log('[sync] Fetching DatasetListed events from chain...');
  
  const { data: events } = await suiClient.queryEvents({
    query: { MoveEventType: `${env.SYNAPSE_PACKAGE_ID}::marketplace::DatasetListed` },
    limit: 100,
    order: 'descending',
  });

  console.log(`[sync] Found ${events.length} on-chain listing events`);
  if (events.length === 0) return;

  // Clear stale cached listings before re-populating
  await clearCachedListings();

  let synced = 0;
  for (const event of events) {
    const parsed = event.parsedJson as any;
    if (!parsed?.listing_id) continue;

    try {
      const obj = await suiClient.getObject({
        id: parsed.listing_id,
        options: { showContent: true },
      });
      const fields = (obj.data?.content as any)?.fields;
      if (!fields) continue;

      await saveCachedListing({
        listingId: parsed.listing_id,
        title: decodeTextBytes(fields.title),
        description: decodeTextBytes(fields.description),
        priceMist: Number(fields.price_mist || 0),
        blobId: fields.blob_ids?.length ? decodeTextBytes(fields.blob_ids[0]) : '',
        policyId: decodeHexBytes(fields.seal_policy_id),
        sellerAddress: fields.owner || parsed.owner, // real seller address from chain
        isActive: fields.is_active !== false,
      });
      synced++;
    } catch (err: any) {
      console.warn(`[sync] Failed to fetch listing ${parsed.listing_id}:`, err.message);
    }
  }

  console.log(`[sync] Chain sync complete — ${synced} listings cached`);
}
