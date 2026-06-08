import { bcs } from '@mysten/sui/bcs';
import { Transaction } from '@mysten/sui/transactions';
const arr = [[1, 2], [3, 4]];
const bytes = bcs.vector(bcs.vector(bcs.u8())).serialize(arr).toBytes();
const tx = new Transaction();
const arg = tx.pure(bytes);
console.log("Success");
