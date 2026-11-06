import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import { supabase } from '../lib/supabase';
import {
  initialCoins,
  initialTrades,
  initialBalanceAdjustments,
  initialDepositRequests,
  initialWithdrawalRequests,
  initialAuditLogs,
  initialSystemSettings,
} from '../data/initialData';

interface AppContextType {
  // Current user & Auth
  users: User[];
  currentUser: User;
  switchUser: (userId: string) => void;
  updateUserStatus: (userId: string, status: 'active' | 'suspended') => void;
  isUserLoggedIn: boolean;
  isSuperAdmin: boolean;
  validateReferralCode: (code: string) => Promise<{ valid: boolean; uid?: string; name?: string; message?: string }>;
  loginUser: (identifier: string, password?: string) => Promise<{ success: boolean; message: string }>; 
  registerUser: (params: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    referralCode: string;
  }) => Promise<{ success: boolean; message: string; user?: User }>;
  logoutUser: () => Promise<void>;

  // Navigation
  activeTab: 'home' | 'market' | 'trade' | 'history' | 'account' | 'admin' | 'login';
  setActiveTab: (tab: 'home' | 'market' | 'trade' | 'history' | 'account' | 'admin' | 'login') => void;

  // Modals
  isSupportOpen: boolean;
  setIsSupportOpen: (open: boolean) => void;
  isDepositModalOpen: boolean;
  setIsDepositModalOpen: (open: boolean) => void;
  isWithdrawModalOpen: boolean;
  setIsWithdrawModalOpen: (open: boolean) => void;
  isTransferModalOpen: boolean;
  setIsTransferModalOpen: (open: boolean) => void;
  transferFunds: (params: {
    fromWallet: 'funding' | 'trading';
    toWallet: 'funding' | 'trading';
    amount: number;
  }) => { success: boolean; message: string };
  selectedTradeDetails: Trade | null;
  setSelectedTradeDetails: (trade: Trade | null) => void;

  // Market & Trading
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
  openTrade: (params: {
    symbol: string;
    type: TradeType;
    leverage: number;
    margin: number;
    durationMinutes: number;
  }) => { success: boolean; message: string };
  closeTrade: (tradeId: string) => void;

  // Support system & Real-time Presence
  supportTickets: SupportTicket[];
  activeSupportUsers: { userId: string; userName: string; uid: string; enteredAt: string }[];
  setUserViewingSupport: (userId: string, isViewing: boolean) => void;
  sendUserMessage: (
    text: string,
    attachment?: { url: string; name: string; type: 'image' | 'file' }
  ) => void;
  sendAdminReply: (
    ticketId: string,
    text: string,
    attachment?: { url: string; name: string; type: 'image' | 'file' }
  ) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  closeSupportSession: (ticketId: string) => void;
  reopenSupportSession: (ticketId: string) => void;
  startNewSupportChat: (userId?: string) => void;
  deleteSupportTicket: (ticketId: string) => void;
  markUserChatAsRead: () => void;

  // Language & Localization
  language: Language;
  setLanguage: (lang: Language) => void;

  // Balance & Transactions
  balanceAdjustments: BalanceAdjustment[];
  adjustUserBalance: (params: {
    userId: string;
    amount: number;
    type: BalanceAdjustmentType;
    reason: string;
    wallet?: 'trading' | 'funding';
  }) => void;

  depositRequests: DepositRequest[];
  submitDepositRequest: (params: {
    amount: number;
    txid: string;
    paymentMethod: string;
    network?: string;
    note?: string;
  }) => void;
  approveDeposit: (depositId: string) => void;
  rejectDeposit: (depositId: string, note?: string) => void;

  withdrawalRequests: WithdrawalRequest[];
  submitWithdrawalRequest: (params: {
    amount: number;
    accountHolderName: string;
    bankOrAddress: string;
    network: string;
    withdrawalType?: 'USD' | 'USDT';
    notes?: string;
  }) => { success: boolean; message: string };
  approveWithdrawal: (withdrawalId: string) => void;
  rejectWithdrawal: (withdrawalId: string, reason: string) => void;

  // Admin & System
  adminName: string;
  auditLogs: AuditLog[];
  systemSettings: SystemSettings;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence loaders
  const loadState = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(`cpt_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  // User profiles come from Supabase. Never hydrate identities from localStorage/demo data.
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [coins, setCoins] = useState<MarketCoin[]>(() => loadState('coins', initialCoins));
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [trades, setTrades] = useState<Trade[]>(() => loadState('trades', initialTrades));
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [balanceAdjustments, setBalanceAdjustments] = useState<BalanceAdjustment[]>(() => loadState('adjustments', initialBalanceAdjustments));
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>(() => loadState('deposits', initialDepositRequests));
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => loadState('withdrawals', initialWithdrawalRequests));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadState('audit', initialAuditLogs));
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => loadState('settings', initialSystemSettings));

  // Navigation & UI state with URL /admin router detection
  const [activeTab, setActiveTab] = useState<'home' | 'market' | 'trade' | 'history' | 'account' | 'admin' | 'login'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (
        path.endsWith('/admin') ||
        hash === '#admin' ||
        params.get('tab') === 'admin' ||
        params.get('admin') === 'true'
      ) {
        return 'admin';
      }
    }
    return 'home';
  });

  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(false);
  const adminName = 'Chief Operator (UK)';

  // Direct /admin URLs select the Admin view, but do not grant permission.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleAdminUrl = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (path.endsWith('/admin') || hash === '#admin' || params.get('tab') === 'admin' || params.get('admin') === 'true') {
        setActiveTab('admin');
      }
    };
    handleAdminUrl();
    window.addEventListener('hashchange', handleAdminUrl);
    window.addEventListener('popstate', handleAdminUrl);
    return () => {
      window.removeEventListener('hashchange', handleAdminUrl);
      window.removeEventListener('popstate', handleAdminUrl);
    };
  }, []);

  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [activeSupportUsers, setActiveSupportUsers] = useState<{ userId: string; userName: string; uid: string; enteredAt: string }[]>(() =>
    []
  );
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTradeDetails, setSelectedTradeDetails] = useState<Trade | null>(null);

  // Support conversations are stored in Supabase, not in this browser's localStorage.
  // RLS ensures a normal user can only load their own tickets; Super Admin can load all.
  const refreshSupportTickets = useCallback(async () => {
    if (!supabase || !isUserLoggedIn || !currentUserId) {
      setSupportTickets([]);
      return;
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*, support_messages(*)')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Could not load support conversations from Supabase:', error.message);
      return;
    }

    const tickets: SupportTicket[] = (data || []).map((row: any) => {
      const messages: SupportMessage[] = (row.support_messages || [])
        .map((message: any) => ({
          id: String(message.id),
          sender: message.sender_role === 'admin' ? 'admin' : 'user',
          senderName: message.sender_name || (message.sender_role === 'admin' ? 'CPT Support' : row.user_name),
          text: message.body || '',
          timestamp: message.created_at ? new Date(message.created_at).toISOString() : '',
          read: Boolean(message.is_read),
          attachmentUrl: message.attachment_url || undefined,
          attachmentName: message.attachment_name || undefined,
          attachmentType: message.attachment_type || undefined,
        }))
        .sort((a: SupportMessage, b: SupportMessage) => a.timestamp.localeCompare(b.timestamp));

      return {
        id: String(row.id),
        userId: String(row.user_id),
        userName: row.user_name || 'User',
        userEmail: row.user_email || '',
        status: row.status as TicketStatus,
        lastMessage: row.last_message || '',
        lastMessageTime: row.last_message_at ? new Date(row.last_message_at).toISOString() : '',
        unreadAdminCount: Number(row.unread_admin_count || 0),
        unreadUserCount: Number(row.unread_user_count || 0),
        isSessionClosed: Boolean(row.is_session_closed),
        messages,
      };
    });

    setSupportTickets(tickets);
  }, [isUserLoggedIn, currentUserId]);

  // Initial load plus Supabase Realtime subscription: messages sent anywhere in the
  // world appear in the authenticated user's/admin's inbox without a page refresh.
  useEffect(() => {
    if (!supabase || !isUserLoggedIn || !currentUserId) {
      setSupportTickets([]);
      return;
    }

    void refreshSupportTickets();
    const channel = supabase
      .channel(`support-inbox-${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        void refreshSupportTickets();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        void refreshSupportTickets();
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Supabase support Realtime connection issue:', status);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isUserLoggedIn, currentUserId, isSuperAdmin, refreshSupportTickets]);

  useEffect(() => {
    localStorage.setItem('cpt_activeSupportUsers', JSON.stringify(activeSupportUsers));
  }, [activeSupportUsers]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('cpt_coins', JSON.stringify(coins));
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('cpt_trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('cpt_adjustments', JSON.stringify(balanceAdjustments));
  }, [balanceAdjustments]);

  useEffect(() => {
    localStorage.setItem('cpt_deposits', JSON.stringify(depositRequests));
  }, [depositRequests]);

  useEffect(() => {
    localStorage.setItem('cpt_withdrawals', JSON.stringify(withdrawalRequests));
  }, [withdrawalRequests]);

  useEffect(() => {
    localStorage.setItem('cpt_audit', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('cpt_settings', JSON.stringify(systemSettings));
  }, [systemSettings]);

  const [language, setLanguage] = useState<Language>(() => loadState('language', 'en'));

  useEffect(() => {
    localStorage.setItem('cpt_language', JSON.stringify(language));
  }, [language]);

  const [marketDataMode, setMarketDataMode] = useState<'live_stream' | 'manual_benchmark'>(() =>
    loadState('marketDataMode', 'live_stream')
  );

  useEffect(() => {
    localStorage.setItem('cpt_marketDataMode', JSON.stringify(marketDataMode));
  }, [marketDataMode]);

  const mapProfile = (row: any): User => ({
    id: row.id,
    uid: String(row.uid),
    name: row.full_name || 'Trader',
    email: row.email || '',
    phone: row.phone || undefined,
    tradingBalance: Number(row.trading_balance || 0),
    fundingBalance: Number(row.funding_balance || 0),
    status: row.status === 'suspended' ? 'suspended' : 'active',
    isOnline: row.id === currentUserId,
    role: row.role === 'superadmin' ? 'superadmin' : row.role === 'admin' ? 'admin' : 'user',
    referredByUid: row.referred_by_uid || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    lastLogin: row.last_login ? new Date(row.last_login).toISOString() : '',
    avatar: undefined,
  });

  const loadAuthenticatedProfiles = async (authUserId: string): Promise<User | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, uid, full_name, email, phone, trading_balance, funding_balance, status, role, referred_by_uid, created_at, last_login')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const mapped = (data || []).map(mapProfile);
    const signedInProfile = mapped.find((u) => u.id === authUserId) || null;
    if (!signedInProfile) throw new Error('Your account profile is not ready. Please contact support or run the Supabase setup SQL.');
    if (signedInProfile.status === 'suspended') throw new Error('This account has been suspended by the administrator.');
    setUsers(mapped);
    setCurrentUserId(authUserId);
    setIsUserLoggedIn(true);
    const superAdmin = signedInProfile.role === 'superadmin' && signedInProfile.status === 'active';
    setIsSuperAdmin(superAdmin);
    return signedInProfile;
  };

  // Keep app authentication tied to Supabase Auth, not localStorage flags.
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const applySession = async (session: any) => {
      if (!active) return;
      if (!session?.user) {
        setUsers([]);
        setCurrentUserId('');
        setIsUserLoggedIn(false);
        setIsSuperAdmin(false);
        return;
      }
      try {
        await loadAuthenticatedProfiles(session.user.id);
      } catch (error) {
        console.error('Unable to load Supabase profile:', error);
        if (active) void supabase.auth.signOut();
        if (active) {
          setUsers([]);
          setCurrentUserId('');
          setIsUserLoggedIn(false);
          setIsSuperAdmin(false);
          }
      }
    };
    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer the profile query until Supabase finishes its auth-state callback.
      setTimeout(() => { void applySession(session); }, 0);
    });
    // Discard obsolete local demo identities and old client-side admin flags.
    localStorage.removeItem('cpt_users');
    localStorage.removeItem('cpt_currentUserId');
    localStorage.removeItem('cpt_activeSupportUsers');
    localStorage.removeItem('cpt_tickets');
    localStorage.removeItem('cpt_isAdmin');
    localStorage.removeItem('cpt_isUserLoggedIn');
    sessionStorage.removeItem('cpt_admin_auth');
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const guestUser: User = {
    id: '', uid: '—', name: 'Guest', email: '', tradingBalance: 0, fundingBalance: 0,
    status: 'active', isOnline: false, role: 'user', createdAt: '', lastLogin: '',
  };
  const currentUser = users.find((u) => u.id === currentUserId) || guestUser;
  const activeCoin = coins.find((c) => c.symbol === selectedSymbol) || coins[0];

  // Live Price Ticker & Trade PnL Updater
  useEffect(() => {
    const interval = setInterval(() => {
      // If in manual benchmark mode, preserve exact prices without random noise
      if (marketDataMode === 'manual_benchmark') return;

      // Small realistic market fluctuation
      setCoins((prevCoins) =>
        prevCoins.map((coin) => {
          if (coin.status === 'paused') return coin;
          const deltaPct = (Math.random() - 0.49) * 0.0018; // ~0.1% micro fluctuation
          const newBase = Number((coin.basePrice * (1 + deltaPct)).toFixed(coin.basePrice > 100 ? 2 : 4));
          const effective = Number((newBase + coin.priceOffset).toFixed(newBase > 100 ? 2 : 4));
          return {
            ...coin,
            basePrice: newBase,
            price: effective,
            high24h: Math.max(coin.high24h, effective),
            low24h: Math.min(coin.low24h, effective),
          };
        })
      );
    }, 1800);

    return () => clearInterval(interval);
  }, [marketDataMode]);

  // Dedicated fast 500ms timer loop: Auto-close trades precisely on duration expiry & settle PnL
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const nowMs = now.getTime();

      setTrades((prevTrades) => {
        const hasOpen = prevTrades.some((t) => t.status === 'OPEN');
        if (!hasOpen) return prevTrades;

        let hasExpired = false;
        const payouts: { userId: string; returnAmount: number }[] = [];

        const updated = prevTrades.map((t) => {
          if (t.status !== 'OPEN') return t;

          const expiryMs =
            t.expiresAtMs ||
            (t.expiresAt.includes('T')
              ? new Date(t.expiresAt).getTime()
              : new Date(t.expiresAt.replace(' ', 'T') + 'Z').getTime() ||
                new Date(t.expiresAt).getTime());

          const isExpired = nowMs >= expiryMs;

          const targetCoin = coins.find((c) => c.symbol === t.symbol);
          const curPrice = targetCoin ? targetCoin.price : t.currentPrice;

          let pnl = 0;
          if (t.type === 'BUY') {
            pnl = ((curPrice - t.entryPrice) / t.entryPrice) * t.positionSize;
          } else {
            pnl = ((t.entryPrice - curPrice) / t.entryPrice) * t.positionSize;
          }
          const pnlPercent = (pnl / t.margin) * 100;

          if (isExpired) {
            hasExpired = true;
            const finalReturn = Math.max(0, t.margin + pnl);
            payouts.push({ userId: t.userId, returnAmount: finalReturn });

            return {
              ...t,
              currentPrice: curPrice,
              exitPrice: curPrice,
              pnl: Number(pnl.toFixed(2)),
              pnlPercent: Number(pnlPercent.toFixed(2)),
              status: 'CLOSED' as const,
              closedAt: now.toISOString(),
            };
          }

          return {
            ...t,
            currentPrice: curPrice,
            pnl: Number(pnl.toFixed(2)),
            pnlPercent: Number(pnlPercent.toFixed(2)),
          };
        });

        if (hasExpired && payouts.length > 0) {
          setTimeout(() => {
            setUsers((prevUsers) =>
              prevUsers.map((u) => {
                const userPayouts = payouts.filter((p) => p.userId === u.id);
                if (userPayouts.length > 0) {
                  const totalReturn = userPayouts.reduce((sum, p) => sum + p.returnAmount, 0);
                  return {
                    ...u,
                    tradingBalance: Number((u.tradingBalance + totalReturn).toFixed(2)),
                  };
                }
                return u;
              })
            );
          }, 0);
        }

        return updated;
      });
    }, 500);

    return () => clearInterval(timer);
  }, [coins]);

  const switchUser = (userId: string) => {
    // This is an admin-only preview selector; it never changes the Supabase identity.
    if (!isSuperAdmin) return;
    const user = users.find((u) => u.id === userId);
    if (user) setCurrentUserId(userId);
  };

  const validateReferralCode = async (code: string) => {
    const cleanCode = (code || '').trim();
    if (!cleanCode) return { valid: false, message: 'Referral Code is required.' };
    if (!supabase) return { valid: false, message: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.' };
    const { data, error } = await supabase.rpc('lookup_referral_code', { p_code: cleanCode });
    if (error) return { valid: false, message: error.message };
    const match = Array.isArray(data) ? data[0] : data;
    return match ? { valid: true, uid: String(match.uid), name: String(match.full_name || 'Trader') } : { valid: false, message: 'Invalid Referral Code. No registered account was found.' };
  };

  const registerUser = async ({
    name,
    email,
    phone,
    password,
    referralCode,
  }: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    referralCode: string;
  }) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanRef = (referralCode || '').trim();
    if (!supabase) return { success: false, message: 'Supabase is not configured. Add the two VITE_SUPABASE variables in Vercel.' };
    if (!cleanName) return { success: false, message: 'Please enter your full name.' };
    if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, message: 'Please enter a valid email address.' };
    if (!password || password.length < 8) return { success: false, message: 'Password must contain at least 8 characters.' };
    if (!cleanRef) return { success: false, message: 'Referral Code is required to register.' };

    const validation = await validateReferralCode(cleanRef);
    if (!validation.valid) return { success: false, message: validation.message || 'Invalid Referral Code.' };

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          phone: phone?.trim() || null,
          referral_code: cleanRef,
        },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
      },
    });
    if (error) return { success: false, message: error.message };

    // Always return the new member to the normal Sign In screen. The profile and
    // referral link are created atomically by the database trigger.
    if (data.session) await supabase.auth.signOut();
    setUsers([]);
    setCurrentUserId('');
    setIsUserLoggedIn(false);
    setIsSuperAdmin(false);
    setActiveTab('login');
    return {
      success: true,
      message: data.session
        ? 'Account created successfully. Please sign in with your email and password.'
        : 'Registration started. Check your email to confirm the account, then sign in.',
    };
  };

  const loginUser = async (identifier: string, password?: string) => {
    if (!supabase) return { success: false, message: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.' };
    const clean = identifier.trim();
    if (!clean || !password) return { success: false, message: 'Enter your email address and password.' };
    if (!clean.includes('@')) return { success: false, message: 'Please sign in with the email address used during registration.' };
    const { data, error } = await supabase.auth.signInWithPassword({ email: clean.toLowerCase(), password });
    if (error || !data.user) return { success: false, message: error?.message || 'Unable to sign in.' };
    try {
      const profile = await loadAuthenticatedProfiles(data.user.id);
      if (!profile) throw new Error('Account profile not found.');
      await supabase.rpc('mark_my_last_login');
      setActiveTab('home');
      return { success: true, message: `Welcome back, ${profile.name}!` };
    } catch (error: any) {
      await supabase.auth.signOut();
      return { success: false, message: error?.message || 'Could not load your account profile.' };
    }
  };

  const logoutUser = async () => {
    if (supabase) await supabase.auth.signOut();
    setUsers([]);
    setCurrentUserId('');
    setIsUserLoggedIn(false);
    setIsSuperAdmin(false);
    setActiveTab('login');
  };

  const updateUserStatus = (userId: string, status: 'active' | 'suspended') => {
    if (!isSuperAdmin || !supabase) return;
    void supabase.rpc('admin_update_profile', {
      p_user_id: userId,
      p_trading_balance: null,
      p_funding_balance: null,
      p_status: status,
    }).then(({ error }) => {
      if (error) console.error('Admin status update failed:', error.message);
    });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
    const targetUser = users.find((u) => u.id === userId);
    logAuditAction(
      status === 'suspended' ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
      `${targetUser?.name || 'User'} (${targetUser?.uid})`,
      `Account marked as ${status} by Admin.`
    );
  };

  const updateCoinSettings = (symbol: string, updates: Partial<MarketCoin>) => {
    setCoins((prev) =>
      prev.map((coin) => {
        if (coin.symbol === symbol) {
          const updated = { ...coin, ...updates };
          if (updates.priceOffset !== undefined || updates.price !== undefined) {
            updated.price = Number((updated.basePrice + (updated.priceOffset || 0)).toFixed(updated.basePrice > 100 ? 2 : 4));
          }
          return updated;
        }
        return coin;
      })
    );
    logAuditAction(
      'MARKET_CONFIG_UPDATE',
      symbol,
      `Market coin parameters calibrated (Offset: ${updates.priceOffset ?? 0}, Spread: ${updates.spread ?? 'N/A'})`
    );
  };

  const setCoinPrice = (symbol: string, newPrice: number) => {
    if (newPrice <= 0) return;
    setCoins((prev) =>
      prev.map((c) => {
        if (c.symbol === symbol) {
          const formatted = Number(newPrice.toFixed(newPrice > 100 ? 2 : 4));
          const change = ((formatted - c.basePrice) / c.basePrice) * 100;
          return {
            ...c,
            price: formatted,
            basePrice: formatted,
            priceOffset: 0,
            change24h: Number(change.toFixed(2)),
            high24h: Math.max(c.high24h, formatted),
            low24h: Math.min(c.low24h, formatted),
          };
        }
        return c;
      })
    );
    logAuditAction(
      'BENCHMARK_PRICE_CALIBRATION',
      symbol,
      `Market benchmark price calibrated to $${newPrice.toLocaleString()}`
    );
  };

  const applyMarketShock = (symbol: string, percentage: number) => {
    setCoins((prev) =>
      prev.map((c) => {
        if (c.symbol === symbol) {
          const multiplier = 1 + percentage / 100;
          const newPrice = Number((c.price * multiplier).toFixed(c.price > 100 ? 2 : 4));
          const newChange = Number((c.change24h + percentage).toFixed(2));
          return {
            ...c,
            price: newPrice,
            basePrice: newPrice,
            priceOffset: 0,
            change24h: newChange,
            high24h: Math.max(c.high24h, newPrice),
            low24h: Math.min(c.low24h, newPrice),
          };
        }
        return c;
      })
    );
    logAuditAction(
      'MARKET_STRESS_TEST',
      symbol,
      `Simulated market shock applied: ${percentage >= 0 ? '+' : ''}${percentage}%`
    );
  };

  const addCustomCoin = (newCoin: MarketCoin) => {
    setCoins((prev) => [...prev, newCoin]);
    logAuditAction(
      'CUSTOM_COIN_ADDED',
      newCoin.symbol,
      `New custom sandbox coin listed: ${newCoin.name} at initial price $${newCoin.price}`
    );
  };

  const openTrade = ({
    symbol,
    type,
    leverage,
    margin,
    durationMinutes,
  }: {
    symbol: string;
    type: TradeType;
    leverage: number;
    margin: number;
    durationMinutes: number;
  }) => {
    if (currentUser.status === 'suspended') {
      return { success: false, message: 'Your account is suspended. Please contact Support.' };
    }

    const positionSize = margin * leverage;
    // User requirement: display shows Fee (0.1%), but actual deduction formula is 0.0005% ($5 per $1,000,000 position)
    const fee = Number((positionSize * 0.000005).toFixed(2));
    const totalDeduction = margin + fee;

    if (currentUser.tradingBalance < totalDeduction) {
      return { success: false, message: 'Insufficient trading balance.' };
    }

    const targetCoin = coins.find((c) => c.symbol === symbol);
    if (!targetCoin) {
      return { success: false, message: 'Invalid symbol.' };
    }

    // Deduct from user
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? { ...u, tradingBalance: Number((u.tradingBalance - totalDeduction).toFixed(2)) }
          : u
      )
    );

    const now = new Date();
    const nowMs = now.getTime();
    const expiryMs = nowMs + durationMinutes * 60 * 1000;
    const expiry = new Date(expiryMs);

    // Use current coin price with spread for execution
    const halfSpread = targetCoin.spread / 2;
    const entryPrice = type === 'BUY' ? targetCoin.price + halfSpread : targetCoin.price - halfSpread;

    const newTrade: Trade = {
      id: `tr-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      symbol,
      type,
      leverage,
      margin,
      positionSize,
      entryPrice: Number(entryPrice.toFixed(targetCoin.price > 100 ? 2 : 4)),
      currentPrice: targetCoin.price,
      status: 'OPEN',
      durationMinutes,
      openedAt: now.toISOString(),
      expiresAt: expiry.toISOString(),
      expiresAtMs: expiryMs,
      pnl: 0,
      pnlPercent: 0,
      fee,
    };

    setTrades((prev) => [newTrade, ...prev]);
    return { success: true, message: `Trade opened successfully for ${symbol}!` };
  };

  const closeTrade = (tradeId: string) => {
    const trade = trades.find((t) => t.id === tradeId);
    if (!trade || trade.status !== 'OPEN') return;

    const targetCoin = coins.find((c) => c.symbol === trade.symbol);
    const curPrice = targetCoin ? targetCoin.price : trade.currentPrice;

    let pnl = 0;
    if (trade.type === 'BUY') {
      pnl = ((curPrice - trade.entryPrice) / trade.entryPrice) * trade.positionSize;
    } else {
      pnl = ((trade.entryPrice - curPrice) / trade.entryPrice) * trade.positionSize;
    }
    const pnlPercent = (pnl / trade.margin) * 100;
    const finalReturn = Math.max(0, trade.margin + pnl);

    // Return to user
    setUsers((prev) =>
      prev.map((u) =>
        u.id === trade.userId
          ? { ...u, tradingBalance: Number((u.tradingBalance + finalReturn).toFixed(2)) }
          : u
      )
    );

    // Mark trade closed
    setTrades((prev) =>
      prev.map((t) =>
        t.id === tradeId
          ? {
              ...t,
              status: 'CLOSED',
              exitPrice: curPrice,
              pnl: Number(pnl.toFixed(2)),
              pnlPercent: Number(pnlPercent.toFixed(2)),
              closedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : t
      )
    );
  };

  // Support System — every ticket/message is written to Supabase and protected by RLS.
  const sendUserMessage = (
    text: string,
    attachment?: { url: string; name: string; type: 'image' | 'file' }
  ) => {
    if ((!text.trim() && !attachment) || !supabase || !isUserLoggedIn || isSuperAdmin) return;

    void (async () => {
      const { error } = await supabase.rpc('send_support_message', {
        p_text: text.trim(),
        p_attachment_url: attachment?.url || null,
        p_attachment_name: attachment?.name || null,
        p_attachment_type: attachment?.type || null,
      });
      if (error) {
        console.error('Could not send support message:', error.message);
        return;
      }
      await refreshSupportTickets();
    })();
  };

  const startNewSupportChat = (_userId?: string) => {
    if (!supabase || !isUserLoggedIn || isSuperAdmin) return;
    void (async () => {
      const { error } = await supabase.rpc('start_support_chat');
      if (error) {
        console.error('Could not start a new support chat:', error.message);
        return;
      }
      await refreshSupportTickets();
    })();
  };

  const closeSupportSession = (ticketId: string) => {
    if (!supabase || !isSuperAdmin) return;
    void (async () => {
      const { error } = await supabase.rpc('admin_set_support_ticket_status', {
        p_ticket_id: ticketId,
        p_status: 'closed',
      });
      if (error) {
        console.error('Could not close support session:', error.message);
        return;
      }
      await refreshSupportTickets();
      const targetTicket = supportTickets.find((t) => t.id === ticketId);
      logAuditAction(
        'SUPPORT_SESSION_CLOSED',
        targetTicket ? `${targetTicket.userName} (${targetTicket.userId})` : ticketId,
        'Support session closed by Super Admin.'
      );
    })();
  };

  const reopenSupportSession = (ticketId: string) => {
    if (!supabase || !isSuperAdmin) return;
    void (async () => {
      const { error } = await supabase.rpc('admin_set_support_ticket_status', {
        p_ticket_id: ticketId,
        p_status: 'pending',
      });
      if (error) {
        console.error('Could not reopen support session:', error.message);
        return;
      }
      await refreshSupportTickets();
    })();
  };

  const deleteSupportTicket = (ticketId: string) => {
    if (!supabase || !isSuperAdmin) return;
    void (async () => {
      const targetTicket = supportTickets.find((t) => t.id === ticketId);
      const { error } = await supabase.rpc('admin_delete_support_ticket', {
        p_ticket_id: ticketId,
      });
      if (error) {
        console.error('Could not delete support ticket:', error.message);
        return;
      }
      await refreshSupportTickets();
      logAuditAction(
        'SUPPORT_TICKET_DELETED',
        targetTicket ? `${targetTicket.userName} (#${targetTicket.id.slice(-6)})` : ticketId,
        'Support conversation deleted by Super Admin.'
      );
    })();
  };

  const sendAdminReply = (
    ticketId: string,
    text: string,
    attachment?: { url: string; name: string; type: 'image' | 'file' }
  ) => {
    if ((!text.trim() && !attachment) || !supabase || !isSuperAdmin) return;
    void (async () => {
      const { error } = await supabase.rpc('admin_send_support_reply', {
        p_ticket_id: ticketId,
        p_text: text.trim(),
        p_attachment_url: attachment?.url || null,
        p_attachment_name: attachment?.name || null,
        p_attachment_type: attachment?.type || null,
      });
      if (error) {
        console.error('Could not send admin support reply:', error.message);
        return;
      }
      await refreshSupportTickets();
      const ticket = supportTickets.find((t) => t.id === ticketId);
      logAuditAction(
        'SUPPORT_REPLY',
        ticket ? `${ticket.userName} (${ticket.userId})` : 'User Ticket',
        'Super Admin sent a support reply.'
      );
    })();
  };

  const updateTicketStatus = (ticketId: string, status: TicketStatus) => {
    if (!supabase || !isSuperAdmin) return;
    void (async () => {
      const { error } = await supabase.rpc('admin_set_support_ticket_status', {
        p_ticket_id: ticketId,
        p_status: status,
      });
      if (error) {
        console.error('Could not update support ticket status:', error.message);
        return;
      }
      await refreshSupportTickets();
    })();
  };

  const markUserChatAsRead = () => {
    if (!supabase || !isUserLoggedIn || isSuperAdmin) return;
    void (async () => {
      const { error } = await supabase.rpc('mark_my_support_messages_read');
      if (error) {
        console.error('Could not mark support messages as read:', error.message);
        return;
      }
      await refreshSupportTickets();
    })();
  };

  const setUserViewingSupport = (userId: string, isViewing: boolean) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const timeStr = new Date().toLocaleTimeString();
    setActiveSupportUsers((prev) => {
      if (isViewing) {
        if (prev.some((p) => p.userId === userId)) return prev;
        return [{ userId, userName: targetUser.name, uid: targetUser.uid, enteredAt: timeStr }, ...prev];
      }
      return prev.filter((p) => p.userId !== userId);
    });
  };

  // Balance Management
  const adjustUserBalance = ({
    userId,
    amount,
    type,
    reason,
    wallet = 'trading',
  }: {
    userId: string;
    amount: number;
    type: BalanceAdjustmentType;
    reason: string;
    wallet?: 'trading' | 'funding';
  }) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const isFunding = wallet === 'funding';
    const previousBalance = isFunding ? targetUser.fundingBalance : targetUser.tradingBalance;
    const newBalance = Number(Math.max(0, previousBalance + amount).toFixed(2));

    if (isSuperAdmin && supabase) {
      void supabase.rpc('admin_update_profile', {
        p_user_id: userId,
        p_trading_balance: isFunding ? null : newBalance,
        p_funding_balance: isFunding ? newBalance : null,
        p_status: null,
      }).then(({ error }) => {
        if (error) console.error('Admin balance update failed:', error.message);
      });
    }
    setUsers((prev) => prev.map((u) => {
      if (u.id !== userId) return u;
      return isFunding ? { ...u, fundingBalance: newBalance } : { ...u, tradingBalance: newBalance };
    }));

    const adjustment: BalanceAdjustment = {
      id: `adj-${Date.now()}`,
      userId,
      userName: targetUser.name,
      amount,
      type,
      previousBalance,
      newBalance,
      reason: `${isFunding ? '[Funding Wallet] ' : '[Trading Wallet] '}${reason}`,
      adminId: 'admin-01',
      adminName,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setBalanceAdjustments((prev) => [adjustment, ...prev]);

    logAuditAction(
      'BALANCE_ADJUSTMENT',
      `${targetUser.name} (${targetUser.uid})`,
      `${amount >= 0 ? '+' : ''}$${amount.toLocaleString()} on ${isFunding ? 'Funding' : 'Trading'} Wallet [${type}]: ${reason}`
    );
  };

  // Deposit Management
  const submitDepositRequest = ({
    amount,
    txid,
    paymentMethod,
    network,
    note,
  }: {
    amount: number;
    txid: string;
    paymentMethod: string;
    network?: string;
    note?: string;
  }) => {
    const newReq: DepositRequest = {
      id: `dep-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      amount,
      txid,
      paymentMethod,
      network: network || 'Default',
      status: 'pending',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      note,
    };
    setDepositRequests((prev) => [newReq, ...prev]);
  };

  const approveDeposit = (depositId: string) => {
    const dep = depositRequests.find((d) => d.id === depositId);
    if (!dep || dep.status !== 'pending') return;

    setDepositRequests((prev) =>
      prev.map((d) =>
        d.id === depositId
          ? {
              ...d,
              status: 'approved',
              reviewedBy: adminName,
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : d
      )
    );

    adjustUserBalance({
      userId: dep.userId,
      amount: dep.amount,
      type: 'deposit',
      reason: `Approved deposit request #${dep.id} (TXID: ${dep.txid.slice(0, 12)}...)`,
    });
  };

  const rejectDeposit = (depositId: string, note?: string) => {
    setDepositRequests((prev) =>
      prev.map((d) =>
        d.id === depositId
          ? {
              ...d,
              status: 'rejected',
              note: note || d.note,
              reviewedBy: adminName,
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : d
      )
    );
    const dep = depositRequests.find((d) => d.id === depositId);
    logAuditAction(
      'DEPOSIT_REJECTED',
      dep ? `${dep.userName} (#${dep.id})` : depositId,
      `Deposit of $${dep?.amount || 0} rejected: ${note || 'Invalid payment verification.'}`
    );
  };

  // Withdrawal Management
  const submitWithdrawalRequest = ({
    amount,
    accountHolderName,
    bankOrAddress,
    network,
    withdrawalType = 'USD',
    notes,
  }: {
    amount: number;
    accountHolderName: string;
    bankOrAddress: string;
    network: string;
    withdrawalType?: 'USD' | 'USDT';
    notes?: string;
  }) => {
    if (currentUser.status === 'suspended') {
      return { success: false, message: 'Account is suspended from withdrawals.' };
    }
    if (amount < systemSettings.minWithdrawal) {
      return { success: false, message: `Minimum withdrawal is $${systemSettings.minWithdrawal}.` };
    }
    if (currentUser.tradingBalance < amount) {
      return { success: false, message: 'Insufficient trading balance.' };
    }

    // Deduct funds immediately upon request
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? { ...u, tradingBalance: Number((u.tradingBalance - amount).toFixed(2)) }
          : u
      )
    );

    const newReq: WithdrawalRequest = {
      id: `wth-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      amount,
      accountHolderName,
      bankOrAddress,
      network,
      withdrawalType,
      notes,
      status: 'pending',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setWithdrawalRequests((prev) => [newReq, ...prev]);

    return {
      success: true,
      message: 'Withdrawal request submitted! Our finance team is reviewing your transaction.',
    };
  };

  const approveWithdrawal = (withdrawalId: string) => {
    const wth = withdrawalRequests.find((w) => w.id === withdrawalId);
    if (!wth || wth.status !== 'pending') return;

    setWithdrawalRequests((prev) =>
      prev.map((w) =>
        w.id === withdrawalId
          ? {
              ...w,
              status: 'approved',
              reviewedBy: adminName,
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : w
      )
    );

    logAuditAction(
      'WITHDRAWAL_APPROVED',
      `${wth.userName} (#${wth.id})`,
      `Approved withdrawal of $${wth.amount.toLocaleString()} to ${wth.accountHolderName} (${wth.network})`
    );
  };

  const rejectWithdrawal = (withdrawalId: string, reason: string) => {
    const wth = withdrawalRequests.find((w) => w.id === withdrawalId);
    if (!wth || wth.status !== 'pending') return;

    // Refund back to user's trading balance
    setUsers((prev) =>
      prev.map((u) =>
        u.id === wth.userId
          ? { ...u, tradingBalance: Number((u.tradingBalance + wth.amount).toFixed(2)) }
          : u
      )
    );

    setWithdrawalRequests((prev) =>
      prev.map((w) =>
        w.id === withdrawalId
          ? {
              ...w,
              status: 'rejected',
              rejectReason: reason,
              reviewedBy: adminName,
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : w
      )
    );

    logAuditAction(
      'WITHDRAWAL_REJECTED',
      `${wth.userName} (#${wth.id})`,
      `Rejected $${wth.amount.toLocaleString()} withdrawal and refunded balance. Reason: ${reason}`
    );
  };

  const logAuditAction = (action: string, target: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      adminName,
      adminId: 'admin-01',
      action,
      target,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const transferFunds = ({
    fromWallet,
    toWallet,
    amount,
  }: {
    fromWallet: 'funding' | 'trading';
    toWallet: 'funding' | 'trading';
    amount: number;
  }) => {
    if (fromWallet === toWallet) {
      return { success: false, message: 'Source and destination wallets must be different.' };
    }
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: 'Please enter a valid transfer amount.' };
    }

    const currentFunding = currentUser.fundingBalance || 0;
    const currentTrading = currentUser.tradingBalance || 0;

    if (fromWallet === 'funding') {
      if (currentFunding < amount) {
        return {
          success: false,
          message: `Insufficient Funding balance ($${currentFunding.toFixed(2)} available).`,
        };
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id
            ? {
                ...u,
                fundingBalance: Number((u.fundingBalance - amount).toFixed(2)),
                tradingBalance: Number((u.tradingBalance + amount).toFixed(2)),
              }
            : u
        )
      );
      logAuditAction(
        'WALLET_TRANSFER',
        currentUser.name,
        `Transferred $${amount.toFixed(2)} from Funding Wallet to Trading Wallet.`
      );
      return {
        success: true,
        message: `Successfully transferred $${amount.toFixed(2)} to Trading Wallet!`,
      };
    } else {
      if (currentTrading < amount) {
        return {
          success: false,
          message: `Insufficient Trading balance ($${currentTrading.toFixed(2)} available).`,
        };
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id
            ? {
                ...u,
                tradingBalance: Number((u.tradingBalance - amount).toFixed(2)),
                fundingBalance: Number((u.fundingBalance + amount).toFixed(2)),
              }
            : u
        )
      );
      logAuditAction(
        'WALLET_TRANSFER',
        currentUser.name,
        `Transferred $${amount.toFixed(2)} from Trading Wallet to Funding Wallet.`
      );
      return {
        success: true,
        message: `Successfully transferred $${amount.toFixed(2)} to Funding Wallet!`,
      };
    }
  };

  const updateSystemSettings = (newSettings: Partial<SystemSettings>) => {
    setSystemSettings((prev) => ({ ...prev, ...newSettings }));
    logAuditAction('SETTINGS_UPDATED', 'Platform Settings', 'System configuration updated.');
  };

  const resetAllData = () => {
    if (supabase) void supabase.auth.signOut();
    Object.keys(localStorage).filter((key) => key.startsWith('cpt_')).forEach((key) => localStorage.removeItem(key));
    setUsers([]);
    setCurrentUserId('');
    setIsUserLoggedIn(false);
    setIsSuperAdmin(false);
    setCoins(initialCoins);
    setTrades(initialTrades);
    setSupportTickets([]);
    setBalanceAdjustments(initialBalanceAdjustments);
    setDepositRequests(initialDepositRequests);
    setWithdrawalRequests(initialWithdrawalRequests);
    setAuditLogs(initialAuditLogs);
    setSystemSettings(initialSystemSettings);
  };

  return (
    <AppContext.Provider
      value={{
        users,
        currentUser,
        switchUser,
        updateUserStatus,
        isUserLoggedIn,
        isSuperAdmin,
        validateReferralCode,
        loginUser,
        registerUser,
        logoutUser,
        activeTab,
        setActiveTab,
        isSupportOpen,
        setIsSupportOpen,
        isDepositModalOpen,
        setIsDepositModalOpen,
        isWithdrawModalOpen,
        setIsWithdrawModalOpen,
        isTransferModalOpen,
        setIsTransferModalOpen,
        transferFunds,
        selectedTradeDetails,
        setSelectedTradeDetails,
        coins,
        selectedSymbol,
        setSelectedSymbol,
        activeCoin,
        updateCoinSettings,
        setCoinPrice,
        applyMarketShock,
        addCustomCoin,
        marketDataMode,
        setMarketDataMode,
        trades,
        openTrade,
        closeTrade,
        supportTickets,
        activeSupportUsers,
        setUserViewingSupport,
        sendUserMessage,
        sendAdminReply,
        updateTicketStatus,
        closeSupportSession,
        reopenSupportSession,
        startNewSupportChat,
        deleteSupportTicket,
        markUserChatAsRead,
        language,
        setLanguage,
        balanceAdjustments,
        adjustUserBalance,
        depositRequests,
        submitDepositRequest,
        approveDeposit,
        rejectDeposit,
        withdrawalRequests,
        submitWithdrawalRequest,
        approveWithdrawal,
        rejectWithdrawal,
        adminName,
        auditLogs,
        systemSettings,
        updateSystemSettings,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
