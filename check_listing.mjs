import { SuiClient } from '@mysten/sui/client';

const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });

const listingId = '0xb00d3925effff0dd74d2086f78c27dd7fab59e40d619a80d874696159887c24a';

const obj = await client.getObject({
  id: listingId,
  options: { showContent: true }
});

console.log(JSON.stringify(obj, null, 2));
