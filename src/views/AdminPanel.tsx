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
  Menu,
  X,
  Eye,
  EyeOff,
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
    currentUser,
    switchUser,
  } = useApp();

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Admin security authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('cpt_admin_auth') === 'true';
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Badges
  const pendingSupport = supportTickets.reduce((acc, t) => acc + (t.status === 'pending' ? 1 : 0), 0);
  const pendingDeposits = depositRequests.filter((d) => d.status === 'pending').length;
  const pendingWithdrawals = withdrawalRequests.filter((w) => w.status === 'pending').length;
  const activeTradesCount = trades.filter((t) => t.status === 'OPEN').length;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const secureAccessKey = '99228222rhiipura'; 
    const cleanPass = adminPassword.trim();

    if (cleanPass === secureAccessKey) {
      const superAdminUser = users.find((u) => u.role === 'superadmin' || u.uid === '100001');
      if (superAdminUser) {
        switchUser(superAdminUser.id);
      }
      setIsAuthenticated(true);
      sessionStorage.setItem('cpt_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক সুপার এডমিন পাসওয়ার্ডটি দিন।');
    }
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('cpt_admin_auth');
    setActiveTab('home');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-[#121622] border border-[#232c40] rounded-2xl w-full max-w-md p-8 shadow-2xl relative text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 mx-auto flex items-center justify-center mb-4">
            <Shield className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-white tracking-wide">
            CPT Markets UK — Super Admin Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Restricted Administrative Access. Authorized Super Administrator only.
          </p>

          <form onSubmit={handleAdminLogin} className="mt-6 space-y-4 text-xs text-left">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Super Admin Account</label>
              <input
                type="text"
                disabled
                value={`${currentUser.name} (${currentUser.email || 'superadmin@cptmarkets.uk'})`}
                className="w-full bg-[#161c2a] border border-[#242e44] text-slate-400 rounded-xl px-4 py-2.5 font-semibold"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Super Admin Password / Key</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter your secure admin password"
                  className="w-full bg-[#161c2a] border border-[#242e44] focus:border-amber-400 text-white rounded-xl pl-4 pr-12 py-2.5 outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && <div className="text-xs text-rose-400 font-medium">{authError}</div>}

            <button
              type="submit"
              className="w-full bg-amber-400 hover:bg-amber-300 text-black font-extrabold py-3 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Sign In to Super Admin Desk
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="w-full text-center text-xs text-slate-400 hover:text-white pt-2 block"
            >
              ← Back to User Trading Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Admin Dashboard', description: 'Metrics & Live Overview', icon: LayoutDashboard, badge: 0 },
    { id: 'users', label: 'User Management', description: 'Accounts & Suspensions', icon: Users, badge: 0 },
    { id: 'support', label: 'Support Inbox', description: 'Live 2-Way Chat Desk', icon: MessageSquare, badge: pendingSupport, badgeColor: 'bg-rose-500 text-white' },
    { id: 'balance', label: 'Balance Management', description: 'Credits & Manual Adjustments', icon: DollarSign, badge: 0 },
    { id: 'markets', label: 'Coins & Market Pairs', description: 'Spread & Calibration', icon: Activity, badge: 0 },
    { id: 'deposits', label: 'Deposit Requests', description: 'TXID Verification & Approvals', icon: CreditCard, badge: pendingDeposits, badgeColor: 'bg-emerald-500 text-black' },
    { id: 'withdrawals', label: 'Withdrawal Requests', description: 'Payout Approvals & Rejections', icon: ArrowUpRight, badge: pendingWithdrawals, badgeColor: 'bg-rose-500 text-white' },
    { id: 'trades', label: 'Trading Management', description: 'Live & Closed Positions', icon: TrendingUp, badge: activeTradesCount, badgeColor: 'bg-amber-400 text-black' },
    { id: 'reports', label: 'Reports & History', description: 'Cashflow & Audit Trail', icon: FileText, badge: 0 },
    { id: 'settings', label: 'Settings Management', description: 'Platform Configurations', icon: Settings, badge: 0 },
  ];

  return (
    <div className="min-h-[90vh] bg-[#0b0e14] flex flex-col">
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
        <button
          onClick={handleAdminLogout}
          className="text-slate-400 hover:text-rose-400 flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout Session</span>
        </button>
      </div>

      <div className="flex flex-1 relative">
        <div className={`
          fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#121622] border-r border-[#1f273a] flex flex-col justify-between
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out
        `}>
          <div className="p-4 space-y-1 overflow-y-auto max-h-[85vh]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveAdminSubTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group cursor-pointer ${
                    activeAdminSubTab === item.id
                      ? 'bg-amber-400 text-black font-bold'
                      : 'text-slate-400 hover:bg-[#161c2a] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${activeAdminSubTab === item.id ? 'text-black' : 'text-slate-400 group-hover:text-amber-400'}`} />
