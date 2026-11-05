import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { HomeView } from './views/HomeView';
import { MarketView } from './views/MarketView';
import { TradeView } from './views/TradeView';
import { OrderHistoryView } from './views/OrderHistoryView';
import { AccountView } from './views/AccountView';
import { AdminPanel } from './views/AdminPanel';
import { UserLoginView } from './views/UserLoginView';
import { SupportModal } from './components/SupportModal';
import { DepositModal } from './components/DepositModal';
import { TransferModal } from './components/TransferModal';
import { ShieldCheck, Headphones, ExternalLink } from 'lucide-react';

const CookieConsentBanner: React.FC = () => {
  const [accepted, setAccepted] = React.useState(() => {
    try {
      return localStorage.getItem('cpt_cookie_consent') === 'true';
    } catch {
      return false;
    }
  });

  if (accepted) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-[#0d121a]/95 backdrop-blur-md border-t border-[#1d2639] py-3.5 px-4 sm:px-8 shadow-2xl transition-all">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
        <p className="leading-relaxed text-center sm:text-left">
          This website uses cookies. Please review our{' '}
          <span className="text-amber-400 underline cursor-pointer hover:text-amber-300">cookie policy</span>.
          {' '}If you agree to our use of cookies, please continue to use our website.
        </p>
        <button
          onClick={() => {
            setAccepted(true);
            try {
              localStorage.setItem('cpt_cookie_consent', 'true');
            } catch {}
          }}
          className="whitespace-nowrap bg-white hover:bg-slate-100 text-black font-semibold text-xs px-5 py-2 rounded-full transition-all shadow-md active:scale-95 cursor-pointer"
        >
          Agree to Cookies Policy
        </button>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, isUserLoggedIn, setIsSupportOpen } = useApp();

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header />

      {/* Main Routed Content */}
      <main className="flex-1 pb-16">
        {/* If user navigates to Admin tab, always show Admin Panel */}
        {activeTab === 'admin' ? (
          <AdminPanel />
        ) : !isUserLoggedIn || activeTab === 'login' ? (
          <UserLoginView />
        ) : (
          <>
            {activeTab === 'home' && <HomeView />}
            {activeTab === 'market' && <MarketView />}
            {activeTab === 'trade' && <TradeView />}
            {activeTab === 'history' && <OrderHistoryView />}
            {activeTab === 'account' && <AccountView />}
          </>
        )}
      </main>

      {/* Persistent Modals */}
      <SupportModal />
      <DepositModal />
      <TransferModal />

      {/* Cookie Banner matching cptmarkets.com screenshot */}
      <CookieConsentBanner />

      {/* Bottom Footer (Only show when not in admin view or login screen) */}
      {activeTab !== 'admin' && activeTab !== 'login' && isUserLoggedIn && (
        <footer className="bg-[#080b10] border-t border-[#181d2a] py-8 px-4 sm:px-6 text-xs text-slate-400">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">CPT</span>
              <span className="font-extrabold text-amber-400">Markets</span>
              <span className="text-[10px] text-amber-500/80 uppercase tracking-widest ml-1 border border-amber-500/30 px-1 rounded">UK</span>
              <span className="text-slate-500 ml-2">© 2026 CPT Market UK Ltd. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-6 text-slate-400">
              <button
                onClick={() => setIsSupportOpen(true)}
                className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>24/7 Official Support</span>
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className="text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Management Panel</span>
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
