import { useState } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useSeal } from '../hooks/useSeal';

interface DecryptPanelProps {
  blobId: string;
  sealPolicyId?: string; // Optional: what the policy ID actually is
}

export default function DecryptPanel({ blobId, sealPolicyId }: DecryptPanelProps) {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { isInitializing, decryptData } = useSeal();
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getOperatorCap = async () => {
    if (!account) throw new Error("Not connected");
    const synapsePackageId = (import.meta as any).env.VITE_SYNAPSE_PACKAGE_ID || '0x_placeholder_synapse_package_id';
    
    const objects = await suiClient.getOwnedObjects({
      owner: account.address,
      filter: { StructType: `${synapsePackageId}::access_control::OperatorCap` }
    });

    if (objects.data.length === 0) {
      throw new Error("You do not own an OperatorCap on this account.");
    }
    return objects.data[0].data?.objectId;
  };

  const handleDecrypt = async () => {
    if (!account) {
      setError("Please connect your wallet first.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Fetch the encrypted blob from Walrus
      // Ideally use the Walrus Aggregator directly for public blobs
      const blobRes = await fetch(`https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`);
      if (!blobRes.ok) throw new Error(`Walrus fetch failed: ${blobRes.statusText}`);
      const arrayBuffer = await blobRes.arrayBuffer();
      const encryptedBytes = new Uint8Array(arrayBuffer);

      // 2. Query for the OperatorCap
      const operatorCapId = await getOperatorCap();
      if (!operatorCapId) throw new Error("Failed to resolve OperatorCap ID");

      // 3. Build the approval transaction
      const synapsePackageId = (import.meta as any).env.VITE_SYNAPSE_PACKAGE_ID || '0x_placeholder_synapse_package_id';
      const tx = new Transaction();
      
      // manual.ts sets policyId to manual_policy_${Date.now()}
      // Without passing it directly, we assume standard memory access.
      // Usually, we'd need to extract it from the actual listing or object, but here we
      // can pass it if provided, else use a fallback.
      const policyStr = sealPolicyId || 'manual_policy_fallback';
      const idBytes = new TextEncoder().encode(policyStr);
      
      tx.moveCall({
        target: `${synapsePackageId}::data_lifecycle::seal_approve_operator_access`,
        arguments: [
          tx.pure.vector('u8', idBytes),
          tx.object(operatorCapId),
        ],
      });
      
      // For dry-running, the sender needs to be the owner of the OperatorCap
      tx.setSender(account.address);
      const txBytes = await tx.build({ client: suiClient as any });

      // 4. Send to Seal Key Servers
      const decrypted = await decryptData(encryptedBytes, txBytes);
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
            disabled={loading || isInitializing || !account}
            style={{ padding: '6px 12px', background: 'white', border: '1px solid #8B5CF6', color: '#8B5CF6', borderRadius: '4px', cursor: 'pointer' }}
          >
            {loading ? 'Decrypting...' : isInitializing ? 'Initializing Session...' : 'Request Decryption (Requires OperatorCap)'}
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
