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
  registerUser: (params: { name: string; email: string; referralCode: string }) => { success: boolean; message: string; user?: User };
  logoutUser: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSupportOpen: boolean;
  setIsSupportOpen: (open: boolean) => void;
  isDepositModalOpen: boolean;
  setIsDepositModalOpen: (open: boolean) => void;
  isWithdrawModalOpen: boolean;
  setIsWithdrawModalOpen: (open: boolean) => void;
  isTransferModalOpen: boolean;
  setIsTransferModalOpen: (open: boolean) => void;
  transferFunds: () => { success: boolean; message: string };
  selectedTradeDetails: Trade | null;
  setSelectedTradeDetails: (trade: Trade | null) => void;
  coins: MarketCoin[];
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  activeCoin: MarketCoin;
  updateCoinSettings: () => void;
  setCoinPrice: () => void;
  applyMarketShock: () => void;
  addCustomCoin: () => void;
  marketDataMode: string;
  setMarketDataMode: (mode: any) => void;
  trades: Trade[];
  openTrade: (params: any) => { success: boolean; message: string };
  closeTrade: () => void;
  supportTickets: SupportTicket[];
  activeSupportUsers: any;
  setUserViewingSupport: () => void;
  sendUserMessage: (text: string) => void;
  sendAdminReply: (ticketId: string, text: string) => void;
  updateTicketStatus: () => void;
  closeSupportSession: () => void;
  reopenSupportSession: () => void;
  startNewSupportChat: () => void;
  deleteSupportTicket: () => void;
  markUserChatAsRead: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  balanceAdjustments: BalanceAdjustment[];
  adjustUserBalance: (params: any) => void;
  depositRequests: DepositRequest[];
  submitDepositRequest: (params: any) => void;
  approveDeposit: (id: string) => void;
  rejectDeposit: (id: string) => void;
  withdrawalRequests: WithdrawalRequest[];
  submitWithdrawalRequest: () => { success: boolean; message: string };
  approveWithdrawal: (id: string) => void;
  rejectWithdrawal: (id: string) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  adminName: string;
  auditLogs: AuditLog[];
  systemSettings: SystemSettings;
  updateSystemSettings: (settings: any) => void;
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
  const [activeSupportUsers] = useState([]);
  const [language, setLanguage] = useState<Language>('en');

  const adminName = 'Chief Operator (UK)';
  const activeCoin = coins.find((c) => c.symbol === selectedSymbol) || coins[0];
  const currentUser = users.find((u) => u.id === currentUserId) || { id: '', name: 'Guest', email: '', role: 'user', uid: '000000', balances: { funding: 0, trading: 0 }, status: 'active' };
  const isSuperAdmin = currentUser.role === 'superadmin';

  useEffect(() => {
    const fetchAllTradingData = async () => {
      // ১. লাইভ কাস্টমার সাপোর্ট মেসেজ লোড
      const { data: cloudTickets } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (cloudTickets) {
        setSupportTickets(cloudTickets.map((t: any) => ({
          id: t.id, userId: t.user_id || 'guest', userName: 'Live Client', userUid: '100002', subject: 'Live Desk Trade Query', status: t.status as TicketStatus, createdAt: t.created_at, updatedAt: t.created_at,
          messages: [{ id: 'msg-' + t.id, sender: 'user', text: t.message, timestamp: t.created_at, read: false }]
        })));
      }

      // ২. ব্যবহারকারীদের লাইভ ট্রেড ট্র্যাকিং (Trades)
      const { data: cloudTrades } = await supabase.from('trades').select('*').order('created_at', { ascending: false });
      if (cloudTrades) {
        setTrades(cloudTrades.map((tr: any) => ({
          id: tr.id, userId: tr.user_id, symbol: tr.symbol, type: tr.type as TradeType, leverage: tr.leverage, margin: tr.margin, openPrice: tr.open_price, closePrice: tr.close_price, status: tr.status, pnl: tr.pnl, createdAt: tr.created_at
        })));
      }

      // ৩. ইউজার প্রোফাইল ও ব্যালেন্স সিঙ্ক
      const { data: cloudProfiles } = await supabase.from('profiles').select('*');
      if (cloudProfiles) {
        setUsers(cloudProfiles.map((p: any) => ({
          id: p.id, uid: p.uid.toString(), name: p.full_name, email: p.email, role: p.role, balances: { funding: p.funding_balance || 0, trading: p.trading_balance || 0 }, status: p.status || 'active'
        })));
      }
    };

    fetchAllTradingData();
    const syncInterval = setInterval(fetchAllTradingData, 4000);
    return () => clearInterval(syncInterval);
  }, []);

  const sendUserMessage = async (text: string) => {
    if (!text.trim()) return;
    await supabase.from('support_tickets').insert([{ user_id: currentUserId || null, message: text, status: 'pending' }]);
  };

  const sendAdminReply = async (ticketId: string, text: string) => {
    await supabase.from('support_tickets').update({ status: 'answered', message: `Admin: ${text}` }).eq('id', ticketId);
  };

  const openTrade = (params: any) => {
    supabase.from('trades').insert([{ user_id: currentUserId, symbol: params.symbol, type: params.type, leverage: params.leverage, margin: params.margin, status: 'OPEN' }]);
    return { success: true, message: 'Trade successfully tracked on Admin Panel' };
  };

  const switchUser = (userId: string) => setCurrentUserId(userId);
  const updateUserStatus = (userId: string, status: any) => setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
  const logoutUser = () => { setIsUserLoggedIn(false); setCurrentUserId(''); };
  const loginUser = (id: string) => { setCurrentUserId(id); setIsUserLoggedIn(true); return { success: true, message: 'OK' }; };
  const registerUser = () => ({ success: true, message: 'Registered' });

  const transferFunds = () => ({ success: true, message: 'Success' });
  const updateCoinSettings = () => {};
  const setCoinPrice = () => {};
  const applyMarketShock = () => {};
  const addCustomCoin = () => {};
  const closeTrade = () => {};
  const setUserViewingSupport = () => {};
  const updateTicketStatus = () => {};
  const closeSupportSession = () => {};
  const reopenSupportSession = () => {};
  const startNewSupportChat = () => {};
  const deleteSupportTicket = () => {};
  const markUserChatAsRead = () => {};
  const adjustUserBalance = () => {};
  const submitDepositRequest = () => {};
  const approveDeposit = () => {};
  const rejectDeposit = () => {};
  const submitWithdrawalRequest = () => ({ success: true, message: 'Success' });
  const approveWithdrawal = () => {};
  const rejectWithdrawal = () => {};
  const updateSystemSettings = () => {};
  const resetAllData = () => {};

  return (
    <AppContext.Provider value={{
      users, currentUser, switchUser, updateUserStatus, isUserLoggedIn, isSuperAdmin, loginUser, registerUser, logoutUser,
      activeTab, setActiveTab, isSupportOpen, setIsSupportOpen, isDepositModalOpen, setIsDepositModalOpen, isWithdrawModalOpen, setIsWithdrawModalOpen, isTransferModalOpen, setIsTransferModalOpen, transferFunds, selectedTradeDetails, setSelectedTradeDetails,
      coins, selectedSymbol, setSelectedSymbol, activeCoin, updateCoinSettings, setCoinPrice, applyMarketShock, addCustomCoin, marketDataMode, setMarketDataMode, trades, openTrade, closeTrade,
