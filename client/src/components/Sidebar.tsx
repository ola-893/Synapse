import { MAIN_NAV, BOTTOM_NAV } from '../types/nav';
import { cn } from '../lib/utils';
import { Network, Plus } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside className="hidden lg:flex w-[280px] h-screen bg-surface-dim border-r border-outline-variant flex-col pt-8 pb-6 px-4 fixed left-0 top-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#e6e2cd] border border-outline-variant flex items-center justify-center">
          <Network className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight text-on-surface">Synapse Stack</h1>
          <p className="text-[11px] font-mono text-outline uppercase tracking-wider">Privacy Layer</p>
        </div>
      </div>

      {/* New Agent Button (UI only; backend wiring not in scope) */}
      <div className="px-2 mb-8">
        <button
          onClick={() => setActiveTab('agents')}
          className="w-full bg-[#d0ec9c] hover:bg-[#c4e38e] text-[#416652] font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">New Agent</span>
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1 px-2">
        {MAIN_NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium',
              activeTab === item.id
                ? 'bg-surface-variant text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
            )}
          >
            <item.icon
              className={cn(
                'w-5 h-5',
                activeTab === item.id ? 'text-primary' : 'text-outline group-hover:text-primary'
              )}
            />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className="pt-6 border-t border-outline-variant px-2 space-y-1">
        {BOTTOM_NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-all duration-200 group text-sm font-medium"
          >
            <item.icon className="w-5 h-5 text-outline group-hover:text-primary" />
            {item.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
