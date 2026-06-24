"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Paperclip,
} from "lucide-react";
import Link from "next/link";

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
    <div className="bubble-agent" style={{ maxWidth: "120px" }}>
      <div className="typing-indicator">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  OPEN: { label: "Open", icon: <AlertCircle size={13} color="#60a5fa" /> },
  IN_PROGRESS: { label: "In Progress", icon: <Clock size={13} color="#fbbf24" /> },
  RESOLVED: { label: "Resolved", icon: <CheckCircle size={13} color="#34d399" /> },
  CLOSED: { label: "Closed", icon: <CheckCircle size={13} color="#4a6080" /> },
};

export default function CustomerTicketPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data);
      setMessages(res.data.messages || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  useEffect(() => {
    const socket = connectSocket();
    socket.emit("join:ticket", { ticketId: id });

    socket.on("message:new", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
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
      if (data.ticketId === id) setTicket((t) => t ? { ...t, status: data.status } : t);
    });
    socket.on("ticket:triaged", (data: { ticketId: string; priority: Priority; category: string; sentiment: number }) => {
      if (data.ticketId === id) setTicket((t) => t ? { ...t, priority: data.priority, category: data.category } : t);
    });

    return () => {
      socket.emit("leave:ticket", { ticketId: id });
      socket.off("message:new");
      socket.off("message:typing");
      socket.off("ticket:updated");
      socket.off("ticket:triaged");
    };
  }, [id, user?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

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

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={22} className="animate-spin" color="var(--text-muted)" />
    </div>
  );

  if (error) return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", background: "var(--bg-base)" }}>
      <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "oklch(0.545 0.205 18 / 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-urgent)" }}>
        <AlertCircle size={24} />
      </div>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>Connection Error</h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>Failed to load ticket details. Please try again.</p>
        <button className="btn-primary" onClick={fetchTicket} style={{ margin: "0 auto", padding: "8px 16px", fontSize: "13px" }}>
          Retry Connection
        </button>
      </div>
    </div>
  );

  if (!ticket) return null;

  const statusCfg = STATUS_CONFIG[ticket.status];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          padding: "14px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-surface)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <Link href="/customer/dashboard">
          <button className="btn-ghost" style={{ padding: "6px 10px" }}>
            <ArrowLeft size={16} />
          </button>
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: "15px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {ticket.title}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
            {statusCfg.icon}
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{statusCfg.label}</span>
            {ticket.agent && (
              <>
                <span style={{ color: "var(--border)", fontSize: "11px" }}>·</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Agent: {ticket.agent.name}</span>
              </>
            )}
            {ticket.category && (
              <>
                <span style={{ color: "var(--border)", fontSize: "11px" }}>·</span>
                <span style={{ fontSize: "11px", color: "#a78bfa" }}>{ticket.category}</span>
              </>
            )}
          </div>
        </div>
        <span className={`badge badge-${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxWidth: "760px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Issue description card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: "14px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            marginBottom: "8px",
          }}
        >
          <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
            Original Issue
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" }}>{ticket.description}</p>
          {ticket.imageUrls.length > 0 && (
            <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
              {ticket.imageUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img
                    src={url}
                    alt={`Attachment ${i + 1}`}
                    style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border)" }}
                  />
                </a>
              ))}
            </div>
          )}
        </motion.div>

        {messages.map((msg, i) => {
          const isMe = msg.sender.id === user?.id;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isMe ? "flex-end" : "flex-start",
                gap: "4px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {!isMe && (
                  <div
                    style={{
                      width: "20px", height: "20px", borderRadius: "50%",
                      background: "rgba(16,185,129,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "9px", fontWeight: "700", color: "#34d399",
                    }}
                  >
                    {msg.sender.name.charAt(0)}
                  </div>
                )}
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{msg.sender.name}</span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                  {new Date(msg.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className={isMe ? "bubble-customer" : msg.isAI ? "bubble-ai" : "bubble-agent"}>
                <p style={{ fontSize: "13px", lineHeight: "1.6", margin: 0 }}>{msg.content}</p>
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
              style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}
            >
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{typing} is typing...</span>
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" ? (
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-surface)",
            flexShrink: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ maxWidth: "760px", width: "100%", display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <textarea
              className="input-field"
              placeholder="Type your message... (Enter to send)"
              value={message}
              onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
              onKeyDown={handleKeyDown}
              rows={2}
              style={{ resize: "none", flex: 1, padding: "10px 14px", fontSize: "13px" }}
            />
            <button
              className="btn-primary"
              onClick={sendMessage}
              disabled={!message.trim() || sending}
              style={{ padding: "10px 16px", alignSelf: "flex-end" }}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-surface)",
            textAlign: "center",
            fontSize: "13px",
            color: "var(--text-muted)",
          }}
        >
          This ticket has been {ticket.status.toLowerCase()}. No further messages can be sent.
        </div>
      )}
    </div>
  );
}
