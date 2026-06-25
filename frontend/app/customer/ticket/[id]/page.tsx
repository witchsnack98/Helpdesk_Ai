"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth.store";
import {
  Send,
  Loader2,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  createdAt: string;
  sender: { id: string; name: string; role: string };
}

interface TicketDetail {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  category?: string;
  imageUrls: string[];
  createdAt: string;
  agent?: { name: string };
  messages: Message[];
}

function TypingIndicator() {
  return (
    <div className="bubble-agent max-w-[120px]">
      <div className="typing-indicator">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  OPEN: { label: "Open", icon: <AlertCircle size={13} className="text-blue-400" /> },
  IN_PROGRESS: { label: "In Progress", icon: <Clock size={13} className="text-amber-400" /> },
  RESOLVED: { label: "Resolved", icon: <CheckCircle size={13} className="text-emerald-400" /> },
  CLOSED: { label: "Closed", icon: <CheckCircle size={13} className="text-slate-500" /> },
};

export default function CustomerTicketPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { data: ticket, isLoading, isError } = useQuery<TicketDetail>({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const res = await api.get(`/tickets/${id}`);
      return res.data;
    },
  });

  useEffect(() => {
    const socket = connectSocket();
    socket.emit("join:ticket", { ticketId: id });

    socket.on("message:new", (msg: Message) => {
      queryClient.setQueryData<TicketDetail>(['ticket', id], (old) => {
        if (!old) return old;
        return { ...old, messages: [...(old.messages || []), msg] };
      });
      setTyping(null);
    });
    
    socket.on("message:typing", (data: { userId: string; userName: string }) => {
      if (data.userId !== user?.id) {
        setTyping(data.userName);
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTyping(null), 3000);
      }
    });
    
    socket.on("ticket:updated", (data: { ticketId: string; status: TicketStatus }) => {
      if (data.ticketId === id) {
        queryClient.setQueryData<TicketDetail>(['ticket', id], (old) => {
          if (!old) return old;
          return { ...old, status: data.status };
        });
      }
    });
    
    socket.on("ticket:triaged", (data: { ticketId: string; priority: Priority; category: string; sentiment: number }) => {
      if (data.ticketId === id) {
        queryClient.setQueryData<TicketDetail>(['ticket', id], (old) => {
          if (!old) return old;
          return { ...old, priority: data.priority, category: data.category };
        });
      }
    });

    return () => {
      socket.emit("leave:ticket", { ticketId: id });
      socket.off("message:new");
      socket.off("message:typing");
      socket.off("ticket:updated");
      socket.off("ticket:triaged");
    };
  }, [id, user?.id, queryClient]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages, typing]);

  const sendMessage = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    const content = message.trim();
    setMessage("");
    try {
      await api.post(`/tickets/${id}/messages`, { content });
    } catch {}
    finally { setSending(false); }
  };

  const handleTyping = () => {
    const socket = connectSocket();
    socket.emit("message:typing", { ticketId: id, userId: user?.id, userName: user?.name });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 size={22} className="animate-spin text-gray-400" />
    </div>
  );

  if (isError) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg-base)]">
      <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
        <AlertCircle size={24} />
      </div>
      <div className="text-center">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Connection Error</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">Failed to load ticket details. Please try again.</p>
        <button className="btn-primary mx-auto px-4 py-2 text-sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['ticket', id] })}>
          Retry Connection
        </button>
      </div>
    </div>
  );

  if (!ticket) return null;

  const statusCfg = STATUS_CONFIG[ticket.status];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 py-3.5 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0 flex items-center gap-4">
        <Link href="/customer/dashboard">
          <button className="btn-ghost px-2.5 py-1.5">
            <ArrowLeft size={16} />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold truncate">
            {ticket.title}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            {statusCfg.icon}
            <span className="text-[11px] text-[var(--text-muted)]">{statusCfg.label}</span>
            {ticket.agent && (
              <>
                <span className="text-[var(--border)] text-[11px]">·</span>
                <span className="text-[11px] text-[var(--text-muted)]">Agent: {ticket.agent.name}</span>
              </>
            )}
            {ticket.category && (
              <>
                <span className="text-[var(--border)] text-[11px]">·</span>
                <span className="text-[11px] text-purple-400">{ticket.category}</span>
              </>
            )}
          </div>
        </div>
        <span className={`badge badge-${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 max-w-[760px] mx-auto w-full">
        {/* Issue description card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] mb-2"
        >
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
            Original Issue
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{ticket.description}</p>
          {ticket.imageUrls.length > 0 && (
            <div className="flex gap-2 mt-2.5 flex-wrap">
              {ticket.imageUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <Image
                    src={url}
                    alt={`Attachment ${i + 1}`}
                    width={72}
                    height={72}
                    className="object-cover rounded-lg border border-[var(--border)]"
                  />
                </a>
              ))}
            </div>
          )}
        </motion.div>

        {ticket.messages?.map((msg) => {
          const isMe = msg.sender.id === user?.id;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5">
                {!isMe && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[9px] font-bold text-emerald-400">
                    {msg.sender.name.charAt(0)}
                  </div>
                )}
                <span className="text-[10px] text-[var(--text-muted)]">{msg.sender.name}</span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {new Date(msg.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className={isMe ? "bubble-customer" : msg.isAI ? "bubble-ai" : "bubble-agent"}>
                <p className="text-[13px] leading-relaxed m-0">{msg.content}</p>
              </div>
            </motion.div>
          );
        })}

        <AnimatePresence>
          {typing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex flex-col items-start gap-1"
            >
              <span className="text-[10px] text-[var(--text-muted)]">{typing} is typing...</span>
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" ? (
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-surface)] shrink-0 flex justify-center">
          <div className="max-w-[760px] w-full flex gap-2.5 items-end">
            <textarea
              className="input-field flex-1 px-3.5 py-2.5 text-[13px] resize-none"
              placeholder="Type your message... (Enter to send)"
              value={message}
              onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
              onKeyDown={handleKeyDown}
              rows={2}
            />
            <button
              className="btn-primary px-4 py-2.5 self-end"
              onClick={sendMessage}
              disabled={!message.trim() || sending}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      ) : (
        <div className="px-6 py-3.5 border-t border-[var(--border)] bg-[var(--bg-surface)] text-center text-[13px] text-[var(--text-muted)]">
          This ticket has been {ticket.status.toLowerCase()}. No further messages can be sent.
        </div>
      )}
    </div>
  );
}
