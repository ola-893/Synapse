import { SuiClient } from '@mysten/dapp-kit/node_modules/@mysten/sui/client';
const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
client.getObject({ objectId: '0x1' }).then(() => console.log('objectId works')).catch(e => console.log('objectId failed', e.message));
client.getObject({ id: '0x1' } as any).then(() => console.log('id works')).catch(e => console.log('id failed', e.message));
