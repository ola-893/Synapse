import { useState } from 'react';
import { useSuiClient, useSignPersonalMessage, useCurrentAccount } from '@mysten/dapp-kit';
import { SessionKey, SealClient } from '@mysten/seal';

export function useSeal() {
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize the Seal client
  const [sealClient] = useState(() => {
    const coreProxy = new Proxy(suiClient as any, {
      get(target, prop) {
        if (prop === 'getObject') {
          return async (args: any) => target.getObject({ ...args, id: args.objectId || args.id });
        }
        return target[prop];
      }
    });

    return new SealClient({
      suiClient: { core: coreProxy } as any,
      serverConfigs: [
        { objectId: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75', weight: 1 },
        { objectId: '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8', weight: 1 }
      ]
    });
  });

  const createSession = async () => {
    if (!account) throw new Error("Wallet not connected");
    setIsInitializing(true);
    try {
      const packageId = (import.meta as any).env.VITE_SEAL_PACKAGE_ID || '0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d';
      
      const newSessionKey = await SessionKey.create({
        address: account.address,
        packageId,
        ttlMin: 15,
        suiClient: suiClient as any,
      });

      // Sign the personal message to prove ownership of the address
      const message = newSessionKey.getPersonalMessage();
      const signatureResponse = await signPersonalMessage({
        message,
        account,
      });
      
      await newSessionKey.setPersonalMessageSignature(signatureResponse.signature);
      
      setSessionKey(newSessionKey);
      setIsInitializing(false);
      return newSessionKey;
    } catch (e) {
      setIsInitializing(false);
      throw e;
    }
  };

  const decryptData = async (encryptedData: Uint8Array, txBytes: Uint8Array) => {
    let currentSessionKey = sessionKey;
    if (!currentSessionKey || currentSessionKey.isExpired()) {
      currentSessionKey = await createSession();
    }

    const decrypted = await sealClient.decrypt({
      data: encryptedData,
      sessionKey: currentSessionKey,
      txBytes,
    });
    
    return new TextDecoder().decode(decrypted);
  };

  const encryptData = async (data: string, policyId: string) => {
    const dataBytes = new TextEncoder().encode(data);
    const packageId = (import.meta as any).env.VITE_SEAL_PACKAGE_ID || '0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d';
    
    const { encryptedObject } = await sealClient.encrypt({
      kemType: 0,
      demType: 1,
      threshold: 1,
      packageId,
      id: policyId,
      data: dataBytes
    });
    
    return new Uint8Array(encryptedObject);
  };

  return { sealClient, sessionKey, createSession, isInitializing, decryptData, encryptData };
}
