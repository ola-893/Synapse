import { ArrowLeftRight, Bot, Database, HelpCircle, LayoutGrid, Lock, Plus, Settings, Store, Wallet } from 'lucide-react';
import type React from 'react';

export type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
};

export const MAIN_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'memory', label: 'Memory', icon: Database },
  { id: 'marketplace', label: 'Marketplace', icon: Store },
  { id: 'encryption', label: 'Encryption', icon: Lock },
  { id: 'deepbook', label: 'DeepBook', icon: ArrowLeftRight },
];

export const BOTTOM_NAV: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'support', label: 'Support', icon: HelpCircle },
];

export const NEW_AGENT_ICON = Plus;
export const WALLET_ICON = Wallet;
