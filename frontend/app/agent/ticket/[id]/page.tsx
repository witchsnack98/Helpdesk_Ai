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
  Zap,
  Brain,
  Copy,
  Check,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
  Clock,
  Ticket as TicketIcon,
  ChevronDown,
  RefreshCw,
  Sparkles,
} from "lucide-react";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  createdAt: string;
  sender: { id: string; name: string; avatar?: string; role: string };
}

interface TicketDetail {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  category?: string;
  sentiment?: number;
  imageUrls: string[];
  createdAt: string;
  customer: { id: string; name: string; email: string; avatar?: string; createdAt: string };
  agent?: { id: string; name: string; email: string };
  messages: Message[];
}

interface PastTicket {
  id: string;
  title: string;
  status: TicketStatus;
  priority: Priority;
  createdAt: string;
}

const STATUS_OPTIONS: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

function SentimentMeter({ score }: { score?: number }) {
  if (score === undefined || score === null) return null;
  const pct = ((score + 1) / 2) * 100; // -1..1 → 0..100
  const label = score < -0.5 ? "Very Negative 😡" : score < -0.2 ? "Negative 😞" : score < 0.2 ? "Neutral 😐" : score < 0.6 ? "Positive 🙂" : "Very Positive 😊";
  const color = score < -0.4 ? "#f43f5e" : score < 0 ? "#f59e0b" : "#10b981";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Customer Sentiment</span>
        <span style={{ fontSize: "11px", color, fontWeight: "600" }}>{label}</span>
      </div>
      <div className="sentiment-bar">
        <motion.div
          className="sentiment-cursor"
          initial={{ left: "50%" }}
          animate={{ left: `${pct}%` }}
          transition={{ type: "spring", stiffness: 100 }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
        <span style={{ fontSize: "9px", color: "#f43f5e" }}>Negative</span>
        <span style={{ fontSize: "9px", color: "#10b981" }}>Positive</span>
      </div>
    </div>
  );
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

export default function AgentTicketPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pastTickets, setPastTickets] = useState<PastTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState<string | null>(null);
  const [suggestedReply, setSuggestedReply] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch ticket data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/tickets/${id}`);
        setTicket(res.data);
        setMessages(res.data.messages || []);
        // Fetch customer's past tickets
        const histRes = await api.get(`/users/${res.data.customer.id}/history`);
        setPastTickets(histRes.data.filter((t: PastTicket) => t.id !== id).slice(0, 5));
      } catch {}
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  // Socket.io setup
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
      if (data.ticketId === id) {
        setTicket((t) => t ? { ...t, status: data.status } : t);
      }
    });
    socket.on("ticket:triaged", (data: any) => {
      if (data.ticketId === id) {
        setTicket((t) => t ? { ...t, priority: data.priority, category: data.category, sentiment: data.sentiment } : t);
      }
    });

    return () => {
      socket.emit("leave:ticket", { ticketId: id });
      socket.off("message:new");
      socket.off("message:typing");
      socket.off("ticket:updated");
      socket.off("ticket:triaged");
    };
  }, [id, user?.id]);

  // Scroll to bottom
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

  const updateStatus = async (status: TicketStatus) => {
    setStatusUpdating(true);
    try {
      await api.patch(`/tickets/${id}`, { status });
      setTicket((t) => t ? { ...t, status } : t);
    } catch {}
    finally { setStatusUpdating(false); }
  };

  const fetchAiSuggestion = async () => {
    setAiLoading(true);
    setSuggestedReply("");
    try {
      const res = await api.post("/ai/suggest-reply", { ticketId: id });
      setSuggestedReply(res.data.reply);
    } catch {}
    finally { setAiLoading(false); }
  };

  const useSuggestedReply = () => {
    setMessage(suggestedReply);
    inputRef.current?.focus();
  };

  const copySuggestion = async () => {
    await navigator.clipboard.writeText(suggestedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={24} className="animate-spin" color="var(--text-muted)" />
      </div>
    );
  }

  if (!ticket) return <div style={{ padding: "32px", color: "var(--text-muted)" }}>Ticket not found.</div>;

  const priorityColor = ticket.priority === "URGENT" ? "#f43f5e" : ticket.priority === "HIGH" ? "#fb923c" : ticket.priority === "MEDIUM" ? "#f59e0b" : "#10b981";

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Bar */}
      <div
        style={{
          padding: "14px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          background: "var(--bg-surface)",
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: priorityColor, flexShrink: 0,
                boxShadow: ticket.priority === "URGENT" ? `0 0 8px ${priorityColor}` : "none",
              }}
            />
            <h1 style={{ fontSize: "15px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {ticket.title}
            </h1>
            <span style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}>
              #{ticket.id.slice(-6)}
            </span>
          </div>
        </div>

        {/* Status selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Status:</span>
          <select
            className="input-field"
            value={ticket.status}
            onChange={(e) => updateStatus(e.target.value as TicketStatus)}
            disabled={statusUpdating}
            style={{ padding: "6px 10px", width: "auto", fontSize: "12px" }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
          {ticket.priority === "URGENT" && (
            <span className="badge badge-urgent" style={{ gap: "4px" }}>
              <AlertTriangle size={9} /> URGENT
            </span>
          )}
        </div>
      </div>

      {/* Three-column layout */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT: Customer Profile ── */}
        <div
          style={{
            width: "260px",
            flexShrink: 0,
            borderRight: "1px solid var(--border)",
            overflowY: "auto",
            padding: "20px 16px",
            background: "var(--bg-surface)",
          }}
        >
          {/* Avatar */}
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(59,130,246,0.15)",
                border: "2px solid rgba(59,130,246,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: "700",
                color: "#60a5fa",
                margin: "0 auto 10px",
              }}
            >
              {ticket.customer.name.charAt(0)}
            </div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
              {ticket.customer.name}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              {ticket.customer.email}
            </div>
          </div>

          <div className="divider" />

          {/* Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
            {[
              { label: "Customer since", value: new Date(ticket.customer.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short" }) },
              { label: "Ticket opened", value: new Date(ticket.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) },
              { label: "Assigned to", value: ticket.agent?.name || "Unassigned" },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "2px" }}>
                  {item.label}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "6px" }}>
              Issue Description
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                lineHeight: "1.6",
                padding: "10px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              {ticket.description}
            </div>
          </div>

          {/* Past tickets */}
          {pastTickets.length > 0 && (
            <div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "8px" }}>
                Past Tickets ({pastTickets.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {pastTickets.map((pt) => (
                  <div
                    key={pt.id}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "3px" }}>
                      {pt.title}
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <span className={`badge badge-${pt.status === "OPEN" ? "open" : pt.status === "IN_PROGRESS" ? "inprogress" : "resolved"}`} style={{ fontSize: "9px", padding: "1px 6px" }}>
                        {pt.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── CENTER: Chat Room ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px", marginTop: "40px" }}>
                No messages yet. Start the conversation.
              </div>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.sender.id === user?.id;
              const isCustomer = msg.sender.role === "CUSTOMER";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i < 10 ? 0 : 0 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isMe ? "flex-end" : "flex-start",
                    gap: "4px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", order: isMe ? 1 : 0 }}>
                    {!isMe && (
                      <div
                        style={{
                          width: "22px", height: "22px", borderRadius: "50%",
                          background: isCustomer ? "rgba(59,130,246,0.2)" : "rgba(16,185,129,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "9px", fontWeight: "700",
                          color: isCustomer ? "#60a5fa" : "#34d399",
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
                    {msg.isAI && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px", fontSize: "10px", color: "#a78bfa" }}>
                        <Zap size={10} /> AI Response
                      </div>
                    )}
                    <p style={{ fontSize: "13px", lineHeight: "1.6", margin: 0 }}>{msg.content}</p>
                  </div>
                </motion.div>
              );
            })}

            {/* Typing indicator */}
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
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--border)",
              background: "var(--bg-surface)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
              <textarea
                ref={inputRef}
                className="input-field"
                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                value={message}
                onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
                onKeyDown={handleKeyDown}
                rows={2}
                style={{
                  resize: "none",
                  flex: 1,
                  padding: "10px 14px",
                  fontSize: "13px",
                  lineHeight: "1.5",
                }}
              />
              <button
                className="btn-primary"
                onClick={sendMessage}
                disabled={!message.trim() || sending}
                style={{ padding: "10px 16px", alignSelf: "flex-end", flexShrink: 0 }}
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: AI Insights ── */}
        <div
          style={{
            width: "280px",
            flexShrink: 0,
            borderLeft: "1px solid var(--border)",
            overflowY: "auto",
            padding: "20px 16px",
            background: "var(--bg-surface)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <div
              style={{
                width: "28px", height: "28px", borderRadius: "8px",
                background: "rgba(139,92,246,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Brain size={15} color="#a78bfa" />
            </div>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>AI Insights</span>
            <span
              style={{
                marginLeft: "auto", fontSize: "9px", fontWeight: "600",
                color: "#a78bfa", background: "rgba(139,92,246,0.1)",
                padding: "2px 6px", borderRadius: "4px", letterSpacing: "0.04em",
              }}
            >
              GEMINI
            </span>
          </div>

          <div className="ai-insights" style={{ marginBottom: "16px" }}>
            {/* Category */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
                Category
              </div>
              {ticket.category ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Zap size={13} color="#a78bfa" />
                  <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: "500" }}>{ticket.category}</span>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "12px" }}>
                  <Loader2 size={12} className="animate-spin" /> Analyzing...
                </div>
              )}
            </div>

            {/* Priority */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
                AI Priority
              </div>
              <span className={`badge badge-${ticket.priority.toLowerCase()}`}>
                {ticket.priority === "URGENT" && <AlertTriangle size={9} />}
                {ticket.priority}
              </span>
            </div>

            {/* Sentiment Meter */}
            {ticket.sentiment !== undefined && (
              <div>
                <SentimentMeter score={ticket.sentiment} />
              </div>
            )}
          </div>

          <div className="divider" />

          {/* AI Suggested Reply */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={13} color="#a78bfa" />
                AI Suggested Reply
              </div>
              <button
                onClick={fetchAiSuggestion}
                className="btn-ghost"
                style={{ fontSize: "11px", padding: "4px 8px", gap: "4px" }}
                disabled={aiLoading}
              >
                {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                Generate
              </button>
            </div>

            <AnimatePresence mode="wait">
              {aiLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(139,92,246,0.06)",
                    border: "1px solid rgba(139,92,246,0.15)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--text-muted)",
                    fontSize: "12px",
                  }}
                >
                  <Loader2 size={14} className="animate-spin" color="#a78bfa" />
                  Generating suggestion...
                </motion.div>
              )}
              {!aiLoading && suggestedReply && (
                <motion.div
                  key="reply"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="ai-suggested-reply" style={{ marginBottom: "10px" }}>
                    {suggestedReply}
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="btn-primary"
                      onClick={useSuggestedReply}
                      style={{ flex: 1, fontSize: "12px", padding: "8px 10px" }}
                    >
                      Use Reply
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={copySuggestion}
                      style={{ padding: "8px 10px", fontSize: "12px" }}
                    >
                      {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    </button>
                  </div>
                </motion.div>
              )}
              {!aiLoading && !suggestedReply && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    padding: "16px",
                    borderRadius: "var(--radius-md)",
                    border: "1px dashed rgba(139,92,246,0.2)",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    lineHeight: "1.6",
                  }}
                >
                  Click <strong style={{ color: "#a78bfa" }}>Generate</strong> to get an AI-crafted reply based on ticket context and customer sentiment.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
