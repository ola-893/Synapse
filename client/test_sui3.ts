import { BaseClient, CoreClient } from '@mysten/sui/client';
const core = new CoreClient({ url: 'https://fullnode.testnet.sui.io:443' });
console.log(typeof core.getObject);
