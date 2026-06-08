import { bcs } from '@mysten/sui/bcs';
const arr = [[1, 2], [3, 4]];
const bytes = bcs.vector(bcs.vector(bcs.u8())).serialize(arr).toBytes();
console.log("Success, bytes length:", bytes.length);
