import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MemoryExplorer from './pages/MemoryExplorer';
import Agents from './pages/Agents';
import Encryption from './pages/Encryption';
import DeepBook from './pages/DeepBook';
import Marketplace from './pages/Marketplace';
import SellData from './pages/SellData';
import { Landing } from './pages/Landing';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import './styles/app.css';

const queryClient = new QueryClient();
const { networkConfig } = createNetworkConfig({
  testnet: { url: 'https://fullnode.testnet.sui.io:443' },
});

type TabId =
  | 'landing'
  | 'dashboard'
  | 'agents'
  | 'sell'
  | 'memory'
  | 'marketplace'
  | 'encryption'
  | 'deepbook'
  | 'settings'
  | 'support';

function ComingSoon() {
  return (
    <div className="p-6">
      <div className="rounded-2xl border border-outline-variant bg-surface/50 p-6">
        <h2 className="text-lg font-semibold text-on-surface">Coming soon</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          This screen is part of the Synapse layout, but the corresponding backend flow isn&apos;t wired up in this frontend
          build yet.
        </p>
      </div>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab: TabId = (location.pathname.replace('/', '') as TabId) || 'landing';
  const pageTitle =
    activeTab === 'agents'
      ? 'Agent Wallet'
      : activeTab === 'sell'
        ? 'Sell Data'
      : activeTab === 'marketplace'
        ? 'Data Marketplace'
        : 'Synapse Market';

  const setActiveTab = (id: string) => {
    const to = (() => {
      switch (id) {
        case 'dashboard':
          return '/dashboard';
        case 'memory':
          return '/memory';
        case 'marketplace':
          return '/marketplace';
        case 'sell':
          return '/sell';
        case 'agents':
          return '/agents';
        case 'encryption':
          return '/encryption';
        case 'deepbook':
          return '/deepbook';
        case 'settings':
          return '/settings';
        case 'support':
          return '/support';
        case 'landing':
        default:
          return '/';
      }
    })();
    navigate(to);
  };

  // Landing must be standalone: no shared sidebar/top nav shell.
  if (location.pathname === '/') {
    return <Landing onEnterApp={() => setActiveTab('marketplace')} />;
  }

  return (
    <div className="flex bg-surface min-h-screen overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="w-full lg:ml-[280px] flex flex-col">
        <TopNav title={pageTitle} />
        <main className="hide-scrollbar overflow-y-auto h-[calc(100vh-72px)]">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/memory" element={<MemoryExplorer />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/sell" element={<SellData />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/encryption" element={<Encryption />} />
            <Route path="/deepbook" element={<DeepBook />} />
            <Route path="/settings" element={<ComingSoon />} />
            <Route path="/support" element={<ComingSoon />} />
            <Route path="*" element={<Landing onEnterApp={() => setActiveTab('marketplace')} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <AppShell />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
