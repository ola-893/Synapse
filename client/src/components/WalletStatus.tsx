import { ConnectButton, useCurrentAccount, useCurrentWallet } from '@mysten/dapp-kit';
import { CheckCircle2, Unplug, Wallet } from 'lucide-react';
import { formatAddress } from '../lib/sui';

export function WalletStatus() {
  const account = useCurrentAccount();
  const wallet = useCurrentWallet();

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-3 py-2">
        {account ? (
          <CheckCircle2 className="h-4 w-4 text-tertiary" />
        ) : (
          <Unplug className="h-4 w-4 text-outline" />
        )}
        <div className="leading-tight">
          <p className="text-[10px] font-mono uppercase tracking-wider text-outline">Sui Testnet</p>
          <p className="text-xs font-medium text-on-surface">
            {account ? formatAddress(account.address) : wallet.isConnecting ? 'Connecting...' : 'Disconnected'}
          </p>
        </div>
      </div>

      <div className="synapse-wallet-button">
        <ConnectButton
          connectText={
            <span className="inline-flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Connect
            </span>
          }
        />
      </div>
    </div>
  );
}
