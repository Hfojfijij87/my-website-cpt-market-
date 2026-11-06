import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  User, Trade, TradeType, SupportTicket, TicketStatus,
  BalanceAdjustment, DepositRequest, WithdrawalRequest, MarketCoin, AuditLog, SystemSettings, Language,
} from '../types';
import { initialCoins, initialSystemSettings } from '../data/initialData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AppContextType {
  users: any; currentUser: any; switchUser: (id: string) => void; updateUserStatus: (id: string, s: any) => void;
  isUserLoggedIn: boolean; isSuperAdmin: boolean; loginUser: (id: string, p?: string) => any; registerUser: (p: any) => any; logoutUser: () => void;
  activeTab: string; setActiveTab: (t: string) => void; isSupportOpen: boolean; setIsSupportOpen: (o: boolean) => void;
  isDepositModalOpen: boolean; setIsDepositModalOpen: (o: boolean) => void; isWithdrawModalOpen: boolean; setIsWithdrawModalOpen: (o: boolean) => void;
  isTransferModalOpen: boolean; setIsTransferModalOpen: (o: boolean) => void; transferFunds: () => any; selectedTradeDetails: any; setSelectedTradeDetails: (t: any) => void;
  coins: any; selectedSymbol: string; setSelectedSymbol: (s: string) => void; activeCoin: any; updateCoinSettings: () => void; setCoinPrice: () => void;
  applyMarketShock: () => void; addCustomCoin: () => void; marketDataMode: string; setMarketDataMode: (m: any) => void;
  trades: any; openTrade: (p: any) => any; closeTrade: () => void; supportTickets: any; activeSupportUsers: any; setUserViewingSupport: () => void;
  sendUserMessage: (t: string) => void; sendAdminReply: (id: string, t: string) => void; updateTicketStatus: () => void; closeSupportSession: () => void;
  reopenSupportSession: () => void; startNewSupportChat: () => void; deleteSupportTicket: () => void; markUserChatAsRead: () => void;
  language: Language; setLanguage: (l: Language) => void; balanceAdjustments: any; adjustUserBalance: (p: any) => void;
  depositRequests: any; submitDepositRequest: (p: any) => void; approveDeposit: (id: string) => void; rejectDeposit: (id: string) => void;
  withdrawalRequests: any; submitWithdrawalRequest: () => any; approveWithdrawal: (id: string) => void; rejectWithdrawal: (id: string) => void;
  isAdmin: boolean; setIsAdmin: (i: boolean) => void; adminName: string; auditLogs: any; systemSettings: any; updateSystemSettings: (s: any) => void; resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<any>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [coins] = useState<any>(initialCoins);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [trades, setTrades] = useState<any>([]);
  const [supportTickets, setSupportTickets] = useState<any>([]);
  const [depositRequests] = useState<any>([]);
  const [withdrawalRequests] = useState<any>([]);
  const [balanceAdjustments] = useState<any>([]);
  const [auditLogs] = useState<any>([]);
  const [systemSettings] = useState<any>(initialSystemSettings);
  
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTradeDetails, setSelectedTradeDetails] = useState<any>(null);
  const [marketDataMode, setMarketDataMode] = useState<any>('live_stream');
  const [activeSupportUsers] = useState<any>([]);
  const [language, setLanguage] = useState<Language>('en');

  const adminName = 'Chief Operator (UK)';
  const activeCoin = coins.find((c: any) => c.symbol === selectedSymbol) || coins;
  const currentUser = users.find((u: any) => u.id === currentUserId) || { id: '', name: 'Guest', email: '', role: 'user', uid: '000000', balances: { funding: 0, trading: 0 }, status: 'active' };
  const isSuperAdmin = currentUser.role === 'superadmin';

  useEffect(() => {
    const fetchAllTradingData = async () => {
      const { data: cloudTickets } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (cloudTickets) {
        setSupportTickets(cloudTickets.map((t: any) => ({
          id: t.id, userId: t.user_id || 'guest', userName: 'Live Client', userUid: '100002', subject: 'Live Desk Trade Query', status: t.status, createdAt: t.created_at, updatedAt: t.created_at,
          messages: [{ id: 'msg-' + t.id, sender: 'user', text: t.message, timestamp: t.created_at, read: false }]
        })));
      }
      const { data: cloudTrades } = await supabase.from('trades').select('*').order('created_at', { ascending: false });
      if (cloudTrades) {
        setTrades(cloudTrades.map((tr: any) => ({
          id: tr.id, userId: tr.user_id, symbol: tr.symbol, type: tr.type, leverage: tr.leverage, margin: tr.margin, openPrice: tr.open_price, closePrice: tr.close_price, status: tr.status, pnl: tr.pnl, createdAt: tr.created_at
        })));
      }
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
  const updateUserStatus = (userId: string, status: any) => setUsers((prev: any) => prev.map((u: any) => u.id === userId ? { ...u, status } : u));
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
      supportTickets, activeSupportUsers, setUserViewingSupport, sendUserMessage, sendAdminReply, updateTicketStatus, closeSupportSession, reopenSupportSession, startNewSupportChat, deleteSupportTicket, markUserChatAsRead,
      language, setLanguage, balanceAdjustments, adjustUserBalance, depositRequests, submitDepositRequest, approveDeposit, rejectDeposit, withdrawalRequests, submitWithdrawalRequest, approveWithdrawal, rejectWithdrawal,
      isAdmin, setIsAdmin, adminName, auditLogs, systemSettings, updateSystemSettings, resetAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
