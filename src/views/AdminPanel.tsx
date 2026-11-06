import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AdminDashboardTab } from './admin/AdminDashboardTab';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminSupportTab } from './admin/AdminSupportTab';
import { AdminBalanceTab } from './admin/AdminBalanceTab';
import { AdminMarketsTab } from './admin/AdminMarketsTab';
import { AdminDepositsTab } from './admin/AdminDepositsTab';
import { AdminWithdrawalsTab } from './admin/AdminWithdrawalsTab';
import { AdminTradesTab } from './admin/AdminTradesTab';
import { AdminReportsTab } from './admin/AdminReportsTab';
import { AdminSettingsTab } from './admin/AdminSettingsTab';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  DollarSign,
  Activity,
  CreditCard,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Settings,
  Shield,
  LogOut,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    setActiveTab,
    supportTickets,
    depositRequests,
    withdrawalRequests,
    trades,
    users,
    adminName,
    isSuperAdmin,
    isUserLoggedIn,
    logoutUser,
  } = useApp();

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleAdminLogout = () => {
    void logoutUser();
  };

  // Badges
  const pendingSupport = supportTickets.reduce((acc, t) => acc + (t.status === 'pending' ? 1 : 0), 0);
  const pendingDeposits = depositRequests.filter((d) => d.status === 'pending').length;
  const pendingWithdrawals = withdrawalRequests.filter((w) => w.status === 'pending').length;
  const activeTradesCount = trades.filter((t) => t.status === 'OPEN').length;

  // Frontend navigation is only a convenience. Supabase RLS and role checks
  // remain the authority for profile data and protected admin operations.
  if (!isUserLoggedIn || !isSuperAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-[#121622] border border-[#232c40] rounded-2xl w-full max-w-md p-8 shadow-2xl relative text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 mx-auto flex items-center justify-center mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">Restricted Admin Access</h2>
          <p className="text-xs text-slate-400 mt-2">
            {!isUserLoggedIn
              ? 'Sign in with your Super Admin account to continue.'
              : 'This account does not have Super Admin permission.'}
          </p>
          <button
            type="button"
            onClick={() => setActiveTab(!isUserLoggedIn ? 'login' : 'home')}
            className="w-full mt-6 bg-amber-400 hover:bg-amber-300 text-black font-extrabold py-3 rounded-xl transition-all"
          >
            {!isUserLoggedIn ? 'Go to Trading Login' : 'Back to Trading'}
          </button>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Admin Dashboard',
      description: 'Metrics & Live Overview',
      icon: LayoutDashboard,
      badge: 0,
    },
    {
      id: 'users',
      label: 'User Management',
      description: 'Accounts & Suspensions',
      icon: Users,
      badge: 0,
    },
    {
      id: 'support',
      label: 'Support Inbox',
      description: 'Live 2-Way Chat Desk',
      icon: MessageSquare,
      badge: pendingSupport,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'balance',
      label: 'Balance Management',
      description: 'Credits & Manual Adjustments',
      icon: DollarSign,
      badge: 0,
    },
    {
      id: 'markets',
      label: 'Coins & Market Pairs',
      description: 'Spread & Calibration',
      icon: Activity,
      badge: 0,
    },
    {
      id: 'deposits',
      label: 'Deposit Requests',
      description: 'TXID Verification & Approvals',
      icon: CreditCard,
      badge: pendingDeposits,
      badgeColor: 'bg-emerald-500 text-black',
    },
    {
      id: 'withdrawals',
      label: 'Withdrawal Requests',
      description: 'Payout Approvals & Rejections',
      icon: ArrowUpRight,
      badge: pendingWithdrawals,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'trades',
      label: 'Trading Management',
      description: 'Live & Closed Positions',
      icon: TrendingUp,
      badge: activeTradesCount,
      badgeColor: 'bg-amber-400 text-black',
    },
    {
      id: 'reports',
      label: 'Reports & History',
      description: 'Cashflow & Audit Trail',
      icon: FileText,
      badge: 0,
    },
    {
      id: 'settings',
      label: 'Settings Management',
      description: 'Platform Configurations',
      icon: Settings,
      badge: 0,
    },
  ];

  return (
    <div className="min-h-[90vh] bg-[#0b0e14] flex flex-col">
      {/* Top Admin Status Bar */}
      <div className="bg-[#121623] border-b border-[#1f273a] px-4 py-2.5 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-lg bg-[#1a2133] text-slate-300"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-white uppercase tracking-wider">
              CPT Markets Admin Portal
            </span>
          </div>

          <span className="hidden sm:inline-block text-slate-400">|</span>
          <span className="hidden sm:inline-block text-slate-400">
            Operator: <strong className="text-amber-400">{adminName}</strong>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span>Online Traders: <strong className="text-emerald-400">{users.filter((u) => u.isOnline).length}</strong></span>
            <span>Live Trades: <strong className="text-amber-400">{activeTradesCount}</strong></span>
          </div>

          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-1.5 bg-[#1a2233] hover:bg-[#232d44] text-slate-200 border border-[#2b3752] px-3 py-1 rounded-lg text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Switch to Trading View</span>
          </button>

          <button
            onClick={handleAdminLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Log Out of Admin Panel"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Admin Content Body with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Sidebar Navigation */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#10141f] md:bg-transparent border-r md:border-r-0 border-[#1e2538] p-4 md:p-0 flex flex-col justify-between shrink-0 transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Admin Navigation
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeAdminSubTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveAdminSubTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 text-black font-extrabold shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:bg-[#151a28] hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-amber-400'}`} />
                    <div>
                      <span className="text-xs font-semibold block">{item.label}</span>
                      <span
                        className={`text-[10px] block ${
                          isActive ? 'text-black/75' : 'text-slate-500'
                        }`}
                      >
                        {item.description}
                      </span>
                    </div>
                  </div>

                  {item.badge > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-black text-amber-400' : item.badgeColor || 'bg-amber-400 text-black'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar bottom footer */}
          <div className="pt-4 border-t border-[#1e2538] text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Role: Super Administrator</span>
            </div>
            <div>CPT Market UK v2.4</div>
          </div>
        </aside>

        {/* Dynamic Admin Sub-View */}
        <main className="flex-1 overflow-x-hidden min-w-0">
          {activeAdminSubTab === 'dashboard' && (
            <AdminDashboardTab onNavigate={(tab) => setActiveAdminSubTab(tab)} />
          )}
          {activeAdminSubTab === 'users' && <AdminUsersTab />}
          {activeAdminSubTab === 'support' && <AdminSupportTab />}
          {activeAdminSubTab === 'balance' && <AdminBalanceTab />}
          {activeAdminSubTab === 'markets' && <AdminMarketsTab />}
          {activeAdminSubTab === 'deposits' && <AdminDepositsTab />}
          {activeAdminSubTab === 'withdrawals' && <AdminWithdrawalsTab />}
          {activeAdminSubTab === 'trades' && <AdminTradesTab />}
          {activeAdminSubTab === 'reports' && <AdminReportsTab />}
          {activeAdminSubTab === 'settings' && <AdminSettingsTab />}
        </main>
      </div>
    </div>
  );
};
