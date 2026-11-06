import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { SupportMessage } from '../types';
import {
  X,
  Send,
  Headphones,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const SupportModal: React.FC = () => {
  const {
    isSupportOpen,
    setIsSupportOpen,
    currentUser,
    supportTickets,
    sendUserMessage,
    markUserChatAsRead,
    setUserViewingSupport,
    startNewSupportChat,
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Keep user chat history across sessions while active ticket controls lock state
  const userTickets = supportTickets.filter((t) => t.userId === currentUser.id);
  const activeTicket = userTickets[0];

  // Combine messages across all tickets chronologically
  const reversedTickets = [...userTickets].reverse();
  const allMessages: (SupportMessage & { isSessionDivider?: boolean })[] = [];

  reversedTickets.forEach((ticket, idx) => {
    ticket.messages.forEach((m) => {
      allMessages.push(m);
    });
    if (ticket.isSessionClosed && idx < reversedTickets.length - 1) {
      allMessages.push({
        id: `divider-${ticket.id}`,
        sender: 'admin',
        senderName: 'System',
        text: 'Session Closed',
        timestamp: ticket.lastMessageTime || '',
        read: true,
        isSessionDivider: true,
      });
    }
  });

  const prevCountRef = useRef(0);

  useEffect(() => {
    if (isSupportOpen) {
      markUserChatAsRead();
      setUserViewingSupport(currentUser.id, true);
      return () => {
        setUserViewingSupport(currentUser.id, false);
      };
    }
  }, [isSupportOpen, currentUser.id]);

  // Scroll to bottom smoothly only when a new message is appended or when opening chat
  useEffect(() => {
    if (isSupportOpen) {
      if (allMessages.length > prevCountRef.current || prevCountRef.current === 0) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
      prevCountRef.current = allMessages.length;
    }
  }, [allMessages.length, isSupportOpen]);

  if (!isSupportOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendUserMessage(inputMessage);
    setInputMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#10141f] border border-[#222a3d] rounded-2xl w-full max-w-lg h-[620px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#151a27] border-b border-[#20283c] px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#151a27]"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">CPT Markets Live Support</h3>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.2 rounded font-medium">
                  24/7 UK Desk
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Connected as: <span className="text-slate-200 font-semibold">{currentUser.name}</span> (UID: {currentUser.uid})
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSupportOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Advisory banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-[11px] text-amber-300 flex items-center gap-2 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>For deposit addresses & account assistance, chat directly with our verified operator.</span>
        </div>

        {/* Message Stream with clean scrolling */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700 overscroll-contain select-text"
        >
          {allMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Headphones className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400 max-w-xs">
                Welcome to CPT Markets UK Official Live Support. Send us a message and an administrative operator will assist you right away.
              </p>
            </div>
          ) : (
            allMessages.map((msg) => {
              if (msg.isSessionDivider) {
                return (
                  <div key={msg.id} className="py-2.5 flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-[#20293d]"></div>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 uppercase tracking-wider bg-[#141926] px-2.5 py-0.5 rounded-full border border-[#252f44]">
                      <span className="text-amber-400">🔒</span>
                      <span>Previous Session Closed</span>
                    </span>
                    <div className="flex-1 h-px bg-[#20293d]"></div>
                  </div>
                );
              }

              const isAdminMsg = msg.sender === 'admin';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAdminMsg ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                    <span className="font-semibold text-slate-300">{msg.senderName}</span>
                    <span>•</span>
                    <span className="font-mono">{msg.timestamp.slice(11, 16)}</span>
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs whitespace-pre-wrap leading-relaxed shadow-sm ${
                      isAdminMsg
                        ? 'bg-[#1e2536] text-slate-100 border border-[#2b354d] rounded-tl-sm'
                        : 'bg-amber-500 text-black font-medium rounded-tr-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar or Closed Session Bar matching screenshot image_6ffb7a20.png */}
        {activeTicket?.isSessionClosed ? (
          <div className="p-3 bg-[#0d1018] border-t border-[#20283c] shrink-0">
            <div className="border border-rose-500/80 bg-[#160d11] rounded-2xl p-3 px-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2 text-rose-500 font-medium text-xs">
                <span className="text-amber-400 text-sm">🔒</span>
                <span>This chat session is closed.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  startNewSupportChat(currentUser.id);
                }}
                className="bg-[#fedb39] hover:bg-[#ffe156] text-black text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Start New Chat
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSend}
            className="bg-[#151a27] border-t border-[#20283c] p-3 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message to support..."
              className="flex-1 bg-[#0d1018] border border-[#222a3e] focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white outline-none placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="bg-amber-400 hover:bg-amber-300 text-black font-bold p-2.5 rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
