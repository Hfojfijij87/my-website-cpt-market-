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
import { Headphones } from 'lucide-react';

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
  const [pathname, setPathname] = React.useState(() => window.location.pathname);

  // Keep browser URLs and the existing in-app navigation state in sync.
  React.useEffect(() => {
    const syncFromUrl = () => {
      const path = window.location.pathname;
      setPathname(path);
      if (path === '/admin' || path.startsWith('/admin/')) setActiveTab('admin');
      else if (path === '/login' || path === '/register' || !isUserLoggedIn) setActiveTab('login');
      else if (path === '/market') setActiveTab('market');
      else if (path === '/trade') setActiveTab('trade');
      else if (path === '/history') setActiveTab('history');
      else if (path === '/account') setActiveTab('account');
      else setActiveTab('home');
    };
    window.addEventListener('popstate', syncFromUrl);
    syncFromUrl();
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [setActiveTab, isUserLoggedIn]);

  React.useEffect(() => {
    const target = activeTab === 'admin' ? '/admin'
      : activeTab === 'login' ? (window.location.pathname === '/register' ? '/register' : '/login')
      : activeTab === 'market' ? '/market'
      : activeTab === 'trade' ? '/trade'
      : activeTab === 'history' ? '/history'
      : activeTab === 'account' ? '/account' : '/';
    if (window.location.pathname !== target) {
      window.history.pushState({}, '', target);
      setPathname(target);
    }
  }, [activeTab]);

  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isLoginRoute = pathname === '/login' || pathname === '/register' || activeTab === 'login';

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans">
      {!isAuthRoute && <Header />}
      <main className="flex-1 pb-16">
        {isAdminRoute || activeTab === 'admin' ? <AdminPanel />
          : isLoginRoute || !isUserLoggedIn ? <UserLoginView />
          : <>
              {activeTab === 'home' && <HomeView />}
              {activeTab === 'market' && <MarketView />}
              {activeTab === 'trade' && <TradeView />}
              {activeTab === 'history' && <OrderHistoryView />}
              {activeTab === 'account' && <AccountView />}
            </>}
      </main>
      {!isAuthRoute && <>
        <SupportModal />
        <DepositModal />
        <TransferModal />
        <CookieConsentBanner />
      </>}
      {pathname !== '/admin' && !pathname.startsWith('/admin/') && !isLoginRoute && isUserLoggedIn && (
        <footer className="bg-[#080b10] border-t border-[#181d2a] py-8 px-4 sm:px-6 text-xs text-slate-400">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">CPT</span>
              <span className="font-extrabold text-amber-400">Markets</span>
              <span className="text-[10px] text-amber-500/80 uppercase tracking-widest ml-1 border border-amber-500/30 px-1 rounded">UK</span>
              <span className="text-slate-500 ml-2">© 2026 CPT Market UK Ltd. All rights reserved.</span>
            </div>
            <button onClick={() => setIsSupportOpen(true)} className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5" /><span>24/7 Official Support</span>
            </button>
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
