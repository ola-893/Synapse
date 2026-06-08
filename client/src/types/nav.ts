import { Bot, Plus, Store, UploadCloud, Wallet } from 'lucide-react';
import type React from 'react';

export type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
};

export const MAIN_NAV: NavItem[] = [
  { id: 'marketplace', label: 'Data Marketplace', icon: Store },
  { id: 'sell', label: 'Sell Data', icon: UploadCloud },
  { id: 'agents', label: 'Agent Wallet', icon: Bot },
];

export const BOTTOM_NAV: NavItem[] = [];

export const NEW_AGENT_ICON = Plus;
export const WALLET_ICON = Wallet;
