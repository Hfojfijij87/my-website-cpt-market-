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
import { Shield, Eye, EyeOff, LogOut } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { setActiveTab, adminName, users, currentUser, switchUser } = useApp();
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<string>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('cpt_admin_auth') === 'true';
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const secureAccessKey = '99228222rhiipura'; 
    if (adminPassword.trim() === secureAccessKey) {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-[#121622] border border-[#232c40] rounded-2xl w-full max-w-md p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 mx-auto flex items-center justify-center mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">CPT Markets UK — Super Admin Portal</h2>
          <form onSubmit={handleAdminLogin} className="mt-6 space-y-4 text-xs text-left">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Super Admin Account</label>
              <input type="text" disabled value={`${currentUser.name} (${currentUser.email || 'superadmin@cptmarkets.uk'})`} className="w-full bg-[#161c2a] border border-[#242e44] text-slate-400 rounded-xl px-4 py-2.5 font-semibold" />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Super Admin Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full bg-[#161c2a] border border-[#242e44] focus:border-amber-400 text-white rounded-xl pl-4 pr-12 py-2.5 outline-none font-mono"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {authError && <div className="text-xs text-rose-400 font-medium">{authError}</div>}
            <button type="submit" className="w-full bg-amber-400 hover:bg-amber-300 text-black font-extrabold py-3 rounded-xl transition-all shadow-md">Sign In to Super Admin Desk</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] bg-[#0b0e14] text-white flex flex-col sm:flex-row">
      {/* বাম পাশের সোজা মেনুবার */}
      <div className="w-full sm:w-64 bg-[#121622] border-r border-[#1f273a] p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-2">
          <div className="pb-4 border-b border-[#1f273a] text-center font-bold text-amber-400 text-xs">CPT ADMIN CONTROL</div>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'users', label: 'User Management' },
            { id: 'support', label: 'Support Inbox' },
            { id: 'balance', label: 'Balance settings' },
            { id: 'markets', label: 'Coins & Market Pairs' },
            { id: 'deposits', label: 'Deposit Requests' },
            { id: 'withdrawals', label: 'Withdrawal Requests' },
            { id: 'trades', label: 'Trading Management' },
            { id: 'reports', label: 'Reports & History' },
            { id: 'settings', label: 'System Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveAdminSubTab(tab.id)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${activeAdminSubTab === tab.id ? 'bg-amber-400 text-black font-bold' : 'text-slate-400 hover:bg-[#161c2a] hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={() => { setIsAuthenticated(false); sessionStorage.removeItem('cpt_admin_auth'); setActiveTab('home'); }} className="mt-8 text-slate-400 hover:text-rose-400 flex items-center gap-2 text-xs font-bold px-4 py-2">
          <LogOut className="w-4 h-4" /> Exit Admin
        </button>
      </div>

      {/* ডান পাশের মূল কন্টেন্ট উইন্ডো */}
      <div className="flex-1 p-4 sm:p-6 overflow-x-hidden">
        {activeAdminSubTab === 'dashboard' && <AdminDashboardTab />}
        {activeAdminSubTab === 'users' && <AdminUsersTab />}
        {activeAdminSubTab === 'support' && <AdminSupportTab />}
        {activeAdminSubTab === 'balance' && <AdminBalanceTab />}
        {activeAdminSubTab === 'markets' && <AdminMarketsTab />}
        {activeAdminSubTab === 'deposits' && <AdminDepositsTab />}
        {activeAdminSubTab === 'withdrawals' && <AdminWithdrawalsTab />}
        {activeAdminSubTab === 'trades' && <AdminTradesTab />}
        {activeAdminSubTab === 'reports' && <AdminReportsTab />}
        {activeAdminSubTab === 'settings' && <AdminSettingsTab />}
      </div>
    </div>
  );
};
