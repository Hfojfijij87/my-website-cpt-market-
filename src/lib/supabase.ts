import { createClient } from '@supabase/supabase-js';
import { User, Trade, SupportTicket, DepositRequest, WithdrawalRequest } from '../types';

// Read Supabase credentials from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 20
  );
};

// Initialize Supabase client if configured
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// Cloud Database Operations (Supabase sync)
// ==========================================

export const syncUserToSupabase = async (user: User) => {
  if (!supabase) return;
  try {
    await supabase.from('users').upsert({
      id: user.id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      trading_balance: user.tradingBalance,
      funding_balance: user.fundingBalance,
      status: user.status,
      is_online: user.isOnline,
      role: user.role || 'user',
      referred_by_uid: user.referredByUid || null,
      password: user.password,
      avatar: user.avatar || '',
      created_at: user.createdAt,
      last_login: user.lastLogin,
    });
  } catch (err) {
    console.warn('Supabase syncUserToSupabase notice:', err);
  }
};

export const syncTradeToSupabase = async (trade: Trade) => {
  if (!supabase) return;
  try {
    await supabase.from('trades').upsert({
      id: trade.id,
      user_id: trade.userId,
      user_name: trade.userName,
      symbol: trade.symbol,
      type: trade.type,
      leverage: trade.leverage,
      margin: trade.margin,
      position_size: trade.positionSize,
      entry_price: trade.entryPrice,
      current_price: trade.currentPrice,
      exit_price: trade.exitPrice || null,
      status: trade.status,
      duration_minutes: trade.durationMinutes,
      opened_at: trade.openedAt,
      closed_at: trade.closedAt || null,
      expires_at: trade.expiresAt,
      pnl: trade.pnl,
      pnl_percent: trade.pnlPercent,
      fee: trade.fee,
    });
  } catch (err) {
    console.warn('Supabase syncTradeToSupabase notice:', err);
  }
};

export const syncTicketToSupabase = async (ticket: SupportTicket) => {
  if (!supabase) return;
  try {
    await supabase.from('support_tickets').upsert({
      id: ticket.id,
      user_id: ticket.userId,
      user_name: ticket.userName,
      user_email: ticket.userEmail,
      status: ticket.status,
      last_message: ticket.lastMessage,
      last_message_time: ticket.lastMessageTime,
      messages: ticket.messages,
    });
  } catch (err) {
    console.warn('Supabase syncTicketToSupabase notice:', err);
  }
};

export const syncDepositToSupabase = async (deposit: DepositRequest) => {
  if (!supabase) return;
  try {
    await supabase.from('deposit_requests').upsert({
      id: deposit.id,
      user_id: deposit.userId,
      user_name: deposit.userName,
      amount: deposit.amount,
      network: deposit.network || deposit.paymentMethod,
      payment_method: deposit.paymentMethod,
      txid: deposit.txid,
      status: deposit.status,
      created_at: deposit.timestamp,
    });
  } catch (err) {
    console.warn('Supabase syncDepositToSupabase notice:', err);
  }
};

export const syncWithdrawalToSupabase = async (withdrawal: WithdrawalRequest) => {
  if (!supabase) return;
  try {
    await supabase.from('withdrawal_requests').upsert({
      id: withdrawal.id,
      user_id: withdrawal.userId,
      user_name: withdrawal.userName,
      amount: withdrawal.amount,
      withdrawal_type: withdrawal.withdrawalType,
      bank_or_address: withdrawal.bankOrAddress,
      network: withdrawal.network,
      status: withdrawal.status,
      notes: withdrawal.notes || '',
      created_at: withdrawal.timestamp,
    });
  } catch (err) {
    console.warn('Supabase syncWithdrawalToSupabase notice:', err);
  }
};
