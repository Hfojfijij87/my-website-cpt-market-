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
  initialCoins,
  initialTrades,
  initialBalanceAdjustments,
  initialDepositRequests,
  initialWithdrawalRequests,
  initialAuditLogs,
  initialSystemSettings,
} from '../data/initialData';

// ১. সুপাবেস ক্লায়েন্ট ইনিশিয়ালাইজেশন (সরাসরি আপনার এনভায়রনমেন্ট ভেরিয়েবল থেকে রিয়েল ডাটাবেজ লিংক কানেক্ট হবে)
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
  registerUser: (params: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    referralCode: string;
  }) => { success: boolean; message: string; user?: User };
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
    if (typeof window === 'undefined') return fallback;
    try {
      const saved = localStorage.getItem(`cpt_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  const [users, setUsers] = useState<User[]>(() => loadState('users', []));
  const [currentUserId, setCurrentUserId] = useState<string>(() => loadState('currentUserId', ''));
  const [coins, setCoins] = useState<MarketCoin[]>(() => loadState('coins', initialCoins));
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [trades, setTrades] = useState<Trade[]>(() => loadState('trades', initialTrades));
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => loadState('tickets', []));
  const [balanceAdjustments, setBalanceAdjustments] = useState<BalanceAdjustment[]>(() => loadState('adjustments', initialBalanceAdjustments));
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>(() => loadState('deposits', initialDepositRequests));
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => loadState('withdrawals', initialWithdrawalRequests));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadState('audit', initialAuditLogs));
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => loadState('settings', initialSystemSettings));
  
  const [activeTab, setActiveTab] = useState<'home' | 'market' | 'trade' | 'history' | 'account' | 'admin' | 'login'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.endsWith('/admin')) return 'admin';
    }
    return 'home';
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => loadState('isAdmin', false));
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(() => loadState('isUserLoggedIn', false));
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTradeDetails, setSelectedTradeDetails] = useState<Trade | null>(null);
  const [marketDataMode, setMarketDataMode] = useState<'live_stream' | 'manual_benchmark'>('live_stream');
  const [activeSupportUsers] = useState([]);
  const [language, setLanguage] = useState<Language>('en');

  const adminName = 'Chief Operator (UK)';
  const activeCoin = coins.find((c) => c.symbol === selectedSymbol) || coins[0];
  const currentUser = users.find((u) => u.id === currentUserId) || { id: '', name: 'Guest', email: '', role: 'user', uid: '000000', balances: { funding: 0, trading: 0 }, status: 'active' };
  const isSuperAdmin = currentUser.role === 'superadmin';

  // 🔄 ডাটাবেজ (Supabase) থেকে রিয়েল-টাইম লাইভ কাস্টমার মেসেজ ও প্রোফাইল ডাটা ফেচিং
  useEffect(() => {
    const fetchCloudData = async () => {
      // সুপাবেস থেকে কাস্টমার মেসেজ ও টিকিট সিঙ্ক করা
      const { data: cloudTickets } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (cloudTickets) {
        const formattedTickets: SupportTicket[] = cloudTickets.map((t: any) => ({
          id: t.id,
          userId: t.user_id,
          userName: 'Live User',
          userUid: '100002',
          subject: 'Customer Live Chat Support',
          status: t.status as TicketStatus,
          createdAt: t.created_at,
          updatedAt: t.created_at,
          messages: [{ id: 'm-1', sender: 'user', text: t.message, timestamp: t.created_at, read: false }]
        }));
        setSupportTickets(formattedTickets);
      }

      // সুপাবেস থেকে রিয়েল ইউজার লিস্ট লোড করা
      const { data: cloudProfiles } = await supabase.from('profiles').select('*');
      if (cloudProfiles) {
        const formattedUsers: User[] = cloudProfiles.map((p: any) => ({
          id: p.id,
          uid: p.uid.toString(),
          name: p.full_name,
          email: p.email,
          role: p.role,
          balances: { funding: 500, trading: 1000 },
          status: 'active'
        }));
        setUsers(formattedUsers);
      }
    };

    fetchCloudData();
    // প্রতি ৫ সেকেন্ড পর পর লাইভ ট্র্যাকিং ইন্টারভাল রান হবে
    const interval = setInterval(fetchCloudData, 5000);
    return () => clearInterval(interval);
  }, []);

  // ✉️ ফোন থেকে কাস্টমার মেসেজ পাঠানোর মূল ব্যাকএন্ড কানেকশন ফাংশন
  const sendUserMessage = async (text: string) => {
    if (!text.trim()) return;

    // সরাসরি ক্লাউড ডাটাবেজ টেবিলে মেসেজটি ইনসার্ট করা হচ্ছে
    const { error } = await supabase.from('support_tickets').insert([
      {
        user_id: currentUserId || null,
        message: text,
        status: 'pending'
      }
    ]);

    if (!error) {
