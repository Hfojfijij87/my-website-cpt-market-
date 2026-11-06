import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  User,
  Trade,
  TradeType,
  SupportTicket,
  SupportMessage,
  TicketStatus,
  BalanceAdjustment,
  BalanceAdjustmentType,
  DepositRequest,
  WithdrawalRequest,
  MarketCoin,
  AuditLog,
  SystemSettings,
  Language,
} from '../types';
import {
  initialUsers,
  initialCoins,
  initialTrades,
  initialSupportTickets,
  initialBalanceAdjustments,
  initialDepositRequests,
  initialWithdrawalRequests,
  initialAuditLogs,
  initialSystemSettings,
} from '../data/initialData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AppContextType {
  users: User[];
  currentUser: User;
  switchUser: (userId: string) => void;
  updateUserStatus: (userId: string, status: 'active' | 'suspended') => void;
  isUserLoggedIn: boolean;
  isSuperAdmin: boolean;
  loginUser: (identifier: string, password?: string) => { success: boolean; message: string };
  registerUser: (params: { name: string; email: string; phone?: string; password?: string; referralCode: string }) => { success: boolean; message: string; user?: User };
  logoutUser: () => void;
  activeTab: 'home' | 'market' | 'trade' | 'history' | 'account' | 'admin' | 'login';
  setActiveTab: (tab: 'home' | 'market' | 'trade' | 'history' | 'account' | 'admin' | 'login') => void;
  isSupportOpen: boolean;
  setIsSupportOpen: (open: boolean) => void;
  isDepositModalOpen: boolean;
  setIsDepositModalOpen: (open: boolean) => void;
  isWithdrawModalOpen: boolean;
  setIsWithdrawModalOpen: (open: boolean) => void;
  isTransferModalOpen: boolean;
  setIsTransferModalOpen: (open: boolean) => void;
  transferFunds: (params: { fromWallet: 'funding' | 'trading'; toWallet: 'funding' | 'trading'; amount: number }) => { success: boolean; message: string };
  selectedTradeDetails: Trade | null;
  setSelectedTradeDetails: (trade: Trade | null) => void;
  coins: MarketCoin[];
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  activeCoin: MarketCoin;
  updateCoinSettings: (symbol: string, updates: Partial<MarketCoin>) => void;
  setCoinPrice: (symbol: string, newPrice: number) => void;
  applyMarketShock: (symbol: string, percentage: number) => void;
  addCustomCoin: (newCoin: MarketCoin) => void;
  marketDataMode: 'live_stream' | 'manual_benchmark';
  setMarketDataMode: (mode: 'live_stream' | 'manual_benchmark') => void;
  trades: Trade[];
  openTrade: (params: { symbol: string; type: TradeType; leverage: number; margin: number; durationMinutes: number }) => { success: boolean; message: string };
  closeTrade: (tradeId: string) => void;
  supportTickets: SupportTicket[];
  activeSupportUsers: { userId: string; userName: string; uid: string; enteredAt: string }[];
  setUserViewingSupport: (userId: string, isViewing: boolean) => void;
  sendUserMessage: (text: string, attachment?: { url: string; name: string; type: 'image' | 'file' }) => void;
  sendAdminReply: (ticketId: string, text: string, attachment?: { url: string; name: string; type: 'image' | 'file' }) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  closeSupportSession: (ticketId: string) => void;
  reopenSupportSession: (ticketId: string) => void;
  startNewSupportChat: (userId?: string) => void;
  deleteSupportTicket: (ticketId: string) => void;
  markUserChatAsRead: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  balanceAdjustments: BalanceAdjustment[];
  adjustUserBalance: (params: { userId: string; amount: number; type: BalanceAdjustmentType; reason: string; wallet?: 'trading' | 'funding' }) => void;
  depositRequests: DepositRequest[];
  submitDepositRequest: (params: { amount: number; txid: string; paymentMethod: string; network?: string; note?: string }) => void;
  approveDeposit: (depositId: string) => void;
  rejectDeposit: (depositId: string, note?: string) => void;
  withdrawalRequests: WithdrawalRequest[];
  submitWithdrawalRequest: (params: { amount: number; accountHolderName: string; bankOrAddress: string; network: string; withdrawalType?: 'USD' | 'USDT'; notes?: string }) => { success: boolean; message: string };
  approveWithdrawal: (withdrawalId: string) => void;
  rejectWithdrawal: (withdrawalId: string, reason: string) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  adminName: string;
  auditLogs: AuditLog[];
  systemSettings: SystemSettings;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loadState = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(`cpt_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  const [users, setUsers] = useState<User[]>(() => loadState('users', initialUsers));
  const [currentUserId, setCurrentUserId] = useState<string>(() => loadState('currentUserId', 'user-827592'));
  const [coins, setCoins] = useState<MarketCoin[]>(() => loadState('coins', initialCoins));
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [trades, setTrades] = useState<Trade[]>(() => loadState('trades', initialTrades));
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => loadState('tickets', initialSupportTickets));
  const [balanceAdjustments, setBalanceAdjustments] = useState<BalanceAdjustment[]>(() => loadState('adjustments', initialBalanceAdjustments));
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>(() => loadState('deposits', initialDepositRequests));
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => loadState('withdrawals', initialWithdrawalRequests));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadState('audit', initialAuditLogs));
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => loadState('settings', initialSystemSettings));
  
  const [activeTab, setActiveTab] = useState<'home' | 'market' | 'trade' | 'history' | 'account' | 'admin' | 'login'>(() => 'home');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => loadState('isAdmin', false));
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(() => loadState('isUserLoggedIn', true));
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTradeDetails, setSelectedTradeDetails] = useState<Trade | null>(null);
  const [marketDataMode, setMarketDataMode] = useState<'live_stream' | 'manual_benchmark'>('live_stream');
  const [activeSupportUsers] = useState<{ userId: string; userName: string; uid: string; enteredAt: string }[]>([]);
  const [language, setLanguage] = useState<Language>('en');

  const adminName = 'Chief Operator (UK)';
  const activeCoin = coins.find((c) => c.symbol === selectedSymbol) || coins[0];
  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const isSuperAdmin = currentUser?.role === 'superadmin';

  useEffect(() => {
    const fetchCloudTickets = async () => {
      try {
        const { data: cloudTickets } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
        if (cloudTickets && cloudTickets.length > 0) {
          setSupportTickets(cloudTickets.map((t: any) => ({
            id: t.id,
            userId: t.user_id || 'guest',
            userName: 'Live Client',
            userUid: '100002',
            subject: 'Customer Live Chat Support',
            status: t.status as TicketStatus,
            createdAt: t.created_at,
            updatedAt: t.created_at,
            messages: [{ id: 'm-' + t.id, sender: 'user', text: t.message, timestamp: t.created_at, read: false }]
          })));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCloudTickets();
    const interval = setInterval(fetchCloudTickets, 4000);
    return () => clearInterval(interval);
  }, []);

  const sendUserMessage = async (text: string) => {
    if (!text.trim()) return;
    const newMsg: SupportMessage = { id: Math.random().toString(), sender: 'user', text: text.trim(), timestamp: new Date().toLocaleTimeString(), read: false };
    setSupportTickets(prev => prev.map(t => t.userId === currentUserId ? { ...t, messages: [...t.messages, newMsg], updatedAt: new Date().toISOString() } : t));
    await supabase.from('support_tickets').insert([{ user_id: currentUserId || null, message: text.trim(), status: 'pending' }]);
  };

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
    localStorage.setItem('cpt_currentUserId', JSON.stringify(userId));
  };

  const updateUserStatus = (userId: string, status: 'active' | 'suspended') => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
  };

  const loginUser = (identifier: string, password?: string) => {
    const found = users.find(u => u.email === identifier || u.uid === identifier);
    if (found) {
      setCurrentUserId(found.id);
      setIsUserLoggedIn(true);
      return { success: true, message: 'Login successful' };
    }
    return { success: false, message: 'User not found' };
  };

  const registerUser = (params: any) => {
