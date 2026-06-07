import { WalletStatus } from './WalletStatus';

interface TopNavProps {
  title?: string;
}

export function TopNav({ title }: TopNavProps) {
  return (
    <header className="h-[72px] sticky top-0 z-10 bg-surface/60 backdrop-blur border-b border-outline-variant">
      <div className="h-full px-6 flex items-center justify-between">
        <div>
          <div className="text-xs font-mono text-outline uppercase tracking-wider">Synapse</div>
          <div className="text-lg font-semibold text-on-surface">{title ?? 'Operator Console'}</div>
        </div>

        <WalletStatus />
      </div>
    </header>
  );
}
