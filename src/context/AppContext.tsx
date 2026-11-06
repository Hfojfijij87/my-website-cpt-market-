import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  User,
  Trade,
  TradeType,
  SupportTicket,
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
  initialSystemSettings,
} from '../data/initialData';

// ১. সুপাবেস ক্লায়েন্ট ইনিশিয়ালাইজেশন
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
  activeTab: string;
  setActiveTab: (tab: any) => void;
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
  activeSupportUsers: any[];
  setUserViewingSupport: (userId: string, isViewing: boolean) => void;
  sendUserMessage: (text: string) => void;
  sendAdminReply: (ticketId: string, text: string) => void;
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
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [coins, setCoins] = useState<MarketCoin[]>(initialCoins);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [balanceAdjustments, setBalanceAdjustments] = useState<BalanceAdjustment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(initialSystemSettings);
  
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTradeDetails, setSelectedTradeDetails] = useState<Trade | null>(null);
  const [marketDataMode, setMarketDataMode] = useState<'live_stream' | 'manual_benchmark'>('live_stream');
  const [language, setLanguage] = useState<Language>('en');

  const adminName = 'Chief Operator (UK)';
  const activeCoin = coins.find((c) => c.symbol === selectedSymbol) || coins[0];
  const currentUser = users.find((u) => u.id === currentUserId) || { id: '', name: 'Guest', email: '', role: 'user', uid: '000000', balances: { funding: 0, trading: 0 }, status: 'active' };
  const isSuperAdmin = currentUser.role === 'superadmin';

  // 🔄 ক্লাউড ডাটাবেজ (Supabase) থেকে সব ফিচার রিয়েল-টাইমে সিঙ্ক করার অটো-লুপ
  useEffect(() => {
    const fetchAllTradingData = async () => {
      // ১. লাইভ কাস্টমার সাপোর্ট মেসেজ লোড
      const { data: cloudTickets } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (cloudTickets) {
        setSupportTickets(cloudTickets.map((t: any) => ({
          id: t.id,
          userId: t.user_id || 'guest',
          userName: 'Live Client',
          userUid: '100002',
          subject: 'Live Desk Trade Query',
          status: t.status as TicketStatus,
          createdAt: t.created_at,
          updatedAt: t.created_at,
          messages: [{ id: 'msg-' + t.id, sender: 'user', text: t.message, timestamp: t.created_at, read: false }]
        })));
      }

      // ২. ব্যবহারকারীদের লাইভ ট্রেড ট্র্যাকিং (Trades)
      const { data: cloudTrades } = await supabase.from('trades').select('*').order('created_at', { ascending: false });
      if (cloudTrades) {
        setTrades(cloudTrades.map((tr: any) => ({
          id: tr.id,
          userId: tr.user_id,
          symbol: tr.symbol,
          type: tr.type as TradeType,
          leverage: tr.leverage,
          margin: tr.margin,
          openPrice: tr.open_price,
          closePrice: tr.close_price,
          status: tr.status,
          pnl: tr.pnl,
          createdAt: tr.created_at
        })));
      }

      // ৩. ইউজার প্রোফাইল ও ব্যালেন্স সিঙ্ক
      const { data: cloudProfiles } = await supabase.from('profiles').select('*');
      if (cloudProfiles) {
        setUsers(cloudProfiles.map((p: any) => ({
          id: p.id,
          uid: p.uid.toString(),
          name: p.full_name,
          email: p.email,
          role: p.role,
          balances: { funding: p.funding_balance || 0, trading: p.trading_balance || 0 },
          status: p.status || 'active'
        })));
      }
    };

    fetchAllTradingData();
    const syncInterval = setInterval(fetchAllTradingData, 4000); // প্রতি ৪ সেকেন্ড পর পর রিয়েল-টাইম রিফ্রেশ
    return () => clearInterval(syncInterval);
  }, []);

  // ✉️ কাস্টমার মেসেজ ও অ্যাকশন মেকানিজম সরাসরি ব্যাকএন্ডে পুশ করার ফাংশন
  const sendUserMessage = async (text: string) => {
    if (!text.trim()) return;
    await supabase.from('support_tickets').insert([{ user_id: currentUserId || null, message: text, status: 'pending' }]);
  };

  const sendAdminReply = async (ticketId: string, text: string) => {
    await supabase.from('support_tickets').update({ status: 'answered', message: `Admin: ${text}` }).eq('id', ticketId);
  };

  const openTrade = (params: any) => {
    // ডাটাবেজে লাইভ অর্ডার এক্সিকিউট করা
    supabase.from('trades').insert([{ user_id: currentUserId, symbol: params.symbol, type: params.type, leverage: params.leverage, margin: params.margin, status: 'OPEN' }]);
    return { success: true, message: 'Trade successfully tracked on Admin Panel' };
  };

  const switchUser = (userId: string) => setCurrentUserId(userId);
  const updateUserStatus = (userId: string, status: any) => setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
  const logoutUser = () => { setIsUserLoggedIn(false); setCurrentUserId(''); };
  const loginUser = (id: string) => { setCurrentUserId(id); setIsUserLoggedIn(true); return { success: true, message: 'OK' }; };
  const registerUser = () => ({ success: true, message: 'Registered' });

  // ফালতু ডেমো মেথড ক্লিনিং
  const transferFunds = () => ({ success: true, message: 'Success' });
  const updateCoinSettings = () => {};
