export interface DatasetListing {
  id: string; // The object ID on Sui
  owner: string;
  title: string;
  description: string;
  priceMist: number;
  blobIds: string[]; // Walrus blob IDs (hex string or base64)
  chunkCount: number;
  sealPolicyId: string;
  isActive: boolean;
  createdAt: number;
}

export interface PurchaseReceipt {
  id: string; // The object ID of the soulbound receipt
  listingId: string;
  buyer: string;
  purchasedAt: number;
}

export interface ListingMetadata {
  title: string;
  description: string;
}
