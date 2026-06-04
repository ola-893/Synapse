import { useState } from 'react';
import { useCurrentAccount, useSignTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useSeal } from '../hooks/useSeal';

interface DecryptPanelProps {
  blobId: string;
}

export default function DecryptPanel({ blobId }: DecryptPanelProps) {
  const account = useCurrentAccount();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const { sessionKey, setSessionKey, decryptData } = useSeal();
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecrypt = async () => {
    if (!account) {
      setError("Please connect your wallet first.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. In a real app, we'd fetch the encrypted blob from Walrus here
      // For this mock, we assume the server provides it or we fetch via Walrus Aggregator
      const blobRes = await fetch(`https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`);
      const arrayBuffer = await blobRes.arrayBuffer();
      const encryptedBytes = new Uint8Array(arrayBuffer);

      // 2. Build the approval transaction (Move call to access_control::seal_approve_memory)
      const tx = new Transaction();
      const idBytes = new TextEncoder().encode('memory-access');
      
      tx.moveCall({
        target: `0x_placeholder_synapse_package_id::access_control::seal_approve_memory`,
        arguments: [
          tx.pure.vector('u8', idBytes),
          tx.object('0x_placeholder_vault_id'),
          tx.object('0x_operator_cap_id_from_wallet'), // Should fetch from wallet owned objects
        ],
      });
      
      // 3. Sign the transaction
      const { bytes: txBytes, signature } = await signTransaction({ transaction: tx });

      // 4. Send to Seal Key Servers
      const decrypted = await decryptData(encryptedBytes, new Uint8Array(Buffer.from(txBytes, 'base64')));
      setPlaintext(decrypted);

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Decryption failed. You may not hold the OperatorCap.");
    }
    setLoading(false);
  };

  return (
    <div>
      {!plaintext ? (
        <div>
          <button 
            onClick={handleDecrypt} 
            disabled={loading || !account}
            style={{ padding: '6px 12px', background: 'white', border: '1px solid #8B5CF6', color: '#8B5CF6', borderRadius: '4px', cursor: 'pointer' }}
          >
            {loading ? 'Decrypting...' : 'Request Decryption (Requires OperatorCap)'}
          </button>
          {error && <p style={{ color: 'red', marginTop: '5px', fontSize: '14px' }}>{error}</p>}
          {!account && <p style={{ color: '#6b7280', marginTop: '5px', fontSize: '14px' }}>Wallet disconnected</p>}
        </div>
      ) : (
        <div style={{ padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontFamily: 'monospace' }}>{plaintext}</p>
        </div>
      )}
    </div>
  );
}
