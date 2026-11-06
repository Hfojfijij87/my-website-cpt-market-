import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { TicketStatus, SupportTicket } from '../../types';
import {
  MessageSquare,
  Search,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  User,
  ShieldCheck,
  ChevronRight,
  Lock,
  Unlock,
  Radio,
  Trash2,
} from 'lucide-react';

export const AdminSupportTab: React.FC = () => {
  const {
    supportTickets,
    sendAdminReply,
    updateTicketStatus,
    closeSupportSession,
    reopenSupportSession,
    deleteSupportTicket,
    activeSupportUsers,
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<'all' | TicketStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string>(() => {
    return supportTickets[0]?.id || '';
  });
  const [replyText, setReplyText] = useState('');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isFirstLoadRef = useRef(true);

  // Sync selected ticket
  const selectedTicket = supportTickets.find((t) => t.id === selectedTicketId) || supportTickets[0];

  // Scroll to bottom only when switching ticket or on initial load
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedTicketId]);

  const filteredTickets = supportTickets.filter((t) => {
    const matchesFilter = filterStatus === 'all' || t.status === filterStatus;
    const matchesSearch =
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    sendAdminReply(selectedTicket.id, replyText);
    setReplyText('');
  };

  const insertTemplate = (text: string) => {
    setReplyText(text);
  };

  return (
    <div className="space-y-4">
      {/* Header and status counts */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <span>Support Message Inbox (Live Support Desk)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time two-way communication between users and the administrative desk.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-[#121622] p-1 rounded-xl border border-[#21293c] text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterStatus === 'all' ? 'bg-amber-400 text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({supportTickets.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-rose-500 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({supportTickets.filter((t) => t.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('answered')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterStatus === 'answered'
                ? 'bg-emerald-500 text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Answered ({supportTickets.filter((t) => t.status === 'answered').length})
          </button>
          <button
            onClick={() => setFilterStatus('closed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterStatus === 'closed'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Closed ({supportTickets.filter((t) => t.status === 'closed').length})
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Chat Layout */}
      <div className="bg-[#10141f] border border-[#20283c] rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 h-[640px]">
        {/* Left Inbox List (5 cols) */}
        <div className="md:col-span-5 border-r border-[#1e2538] flex flex-col bg-[#121623]">
          {/* Search box */}
          <div className="p-3 border-b border-[#1f273a]">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-[#161c2b] border border-[#242e44] focus:border-amber-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Ticket list */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#1b2234]">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No tickets matching current filter.
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = selectedTicket?.id === ticket.id;
                const isViewing = activeSupportUsers.some((u) => u.userId === ticket.userId);
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#1b2235] border-l-4 border-amber-400'
                        : 'hover:bg-[#161c2b]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white capitalize">{ticket.userName}</span>
                        {ticket.unreadAdminCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                        )}
                        {isViewing && (
                          <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Live
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded capitalize ${
                          ticket.status === 'pending'
                            ? 'bg-rose-500/20 text-rose-400'
                            : ticket.status === 'answered'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-700/40 text-slate-400'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 truncate mt-1">{ticket.lastMessage}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1.5">
                      <span>{ticket.userEmail}</span>
                      <span>{ticket.lastMessageTime.slice(11, 16)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Conversation Pane (7 cols) */}
        <div className="md:col-span-7 flex flex-col bg-[#0e121c] h-full overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Conversation Header with status controls & session lock */}
              <div className="bg-[#141926] border-b border-[#1f273a] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white capitalize">
                      {selectedTicket.userName}
                    </h3>
                    <span className="text-[11px] font-mono text-amber-400">({selectedTicket.userEmail})</span>
                  </div>
                  <span className="text-[11px] text-slate-400">User ID: {selectedTicket.userId}</span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.isSessionClosed ? (
                    <button
                      onClick={() => reopenSupportSession(selectedTicket.id)}
                      className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Reopen user chat session"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Reopen Session</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => closeSupportSession(selectedTicket.id)}
                      className="bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Close user chat session (Shows closed lock on user screen)"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Close Session</span>
                    </button>
                  )}

                  <select
                    value={selectedTicket.status}
                    onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value as TicketStatus)}
                    className="bg-[#1c2336] border border-[#2b3650] text-xs text-white rounded-lg px-2.5 py-1 outline-none font-semibold cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="answered">Answered</option>
                    <option value="closed">Closed</option>
                  </select>

                  <button
                    onClick={() => {
                      if (window.confirm(`Permanently delete this chat conversation for ${selectedTicket.userName}?`)) {
                        deleteSupportTicket(selectedTicket.id);
                      }
                    }}
                    className="bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Permanently delete this chat ticket from system"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Active User Viewing Presence Banner */}
              {activeSupportUsers.some((u) => u.userId === selectedTicket.userId) && (
                <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 flex items-center gap-2 text-xs text-emerald-400 shrink-0">
                  <Radio className="w-4 h-4 animate-pulse text-emerald-400 shrink-0" />
                  <span className="font-bold">
                    🟢 {selectedTicket.userName} is actively inside the Live Support desk right now!
                  </span>
                </div>
              )}

              {/* Chat Stream with independent admin scrollable container with min-h-0 */}
              <div
                ref={chatContainerRef}
                className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700 overscroll-contain select-text"
              >
                {selectedTicket.messages.map((msg) => {
                  const isFromAdmin = msg.sender === 'admin';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isFromAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                        <span className="font-semibold text-slate-300">{msg.senderName}</span>
                        <span>•</span>
                        <span className="font-mono">{msg.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs whitespace-pre-wrap leading-relaxed shadow-sm ${
                          isFromAdmin
                            ? 'bg-amber-400 text-black font-medium rounded-tr-sm'
                            : 'bg-[#1b2234] text-slate-100 border border-[#28334c] rounded-tl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Reply Templates */}
              <div className="bg-[#121622] border-t border-[#1e2538] px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px]">
                <span className="text-slate-400 shrink-0 font-medium">Templates:</span>
                <button
                  onClick={() =>
                    insertTemplate(
                      'Hello! Our verified treasury deposit address is: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t (USDT TRC-20). Please send the TXID once completed.'
                    )
                  }
                  className="bg-[#182030] hover:bg-[#222c42] text-amber-400 px-2 py-1 rounded border border-[#26334d] whitespace-nowrap"
                >
                  💳 Deposit TRC-20 Address
                </button>
                <button
                  onClick={() =>
                    insertTemplate(
                      'Your withdrawal request has been verified and processed by our finance desk. Thank you for trading with CPT Markets UK.'
                    )
                  }
                  className="bg-[#182030] hover:bg-[#222c42] text-slate-300 hover:text-white px-2 py-1 rounded border border-[#26334d] whitespace-nowrap"
                >
                  ✅ Withdrawal Processed
                </button>
                <button
                  onClick={() =>
                    insertTemplate(
                      'A promotional bonus credit has been approved and added to your trading wallet balance.'
                    )
                  }
                  className="bg-[#182030] hover:bg-[#222c42] text-slate-300 hover:text-white px-2 py-1 rounded border border-[#26334d] whitespace-nowrap"
                >
                  🎁 Bonus Credited
                </button>
              </div>

              {/* Reply Input Bar */}
              <form
                onSubmit={handleSendReply}
                className="bg-[#141926] border-t border-[#1f273a] p-3 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply directly to ${selectedTicket.userName}... (User will see this in their Live Support)`}
                  className="flex-1 bg-[#0b0e15] border border-[#21293c] focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-300 text-black font-bold p-2.5 rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span className="text-xs pr-1">Reply</span>
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Select a conversation to view and reply.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
