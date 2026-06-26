"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle,
  Circle,
  Ticket as TicketIcon,
  Zap,
  MessageSquare,
  User,
  Wifi,
  WifiOff,
  InboxIcon,
} from "lucide-react";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface TicketRow {
  id: string;
  title: string;
  status: TicketStatus;
  priority: Priority;
  category?: string;
  sentiment?: number;
  createdAt: string;
  customer: { id: string; name: string; email: string; avatar?: string };
  agent?: { id: string; name: string };
  _count: { messages: number };
  isNew?: boolean;
}

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  urgent: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<Priority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SentimentChip({ score }: { score?: number }) {
  if (score === undefined || score === null)
    return <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>—</span>;

  const isNeg = score < -0.3;
  const isNeu = score >= -0.3 && score < 0.2;
  const color = isNeg ? "#f43f5e" : isNeu ? "#f59e0b" : "#10b981";
  const label = isNeg ? "Negative" : isNeu ? "Neutral" : "Positive";
  const numeric = score.toFixed(2);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>
        {label}
      </span>
      <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace" }}>
        {numeric}
      </span>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const config: Record<Priority, { color: string; bg: string; border: string }> = {
    URGENT: { color: "#fb7185", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.25)" },
    HIGH: { color: "#fb923c", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.2)" },
    MEDIUM: { color: "#fbbf24", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.18)" },
    LOW: { color: "#34d399", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.18)" },
  };
  const { color, bg, border } = config[priority];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        background: bg,
        color,
        border: `1px solid ${border}`,
      }}
    >
      {priority === "URGENT" && <AlertTriangle size={8} />}
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const config: Record<TicketStatus, { icon: React.ReactNode; label: string; color: string }> = {
    OPEN: { icon: <Circle size={10} />, label: "Open", color: "#60a5fa" },
    IN_PROGRESS: { icon: <Clock size={10} />, label: "In Progress", color: "#fbbf24" },
    RESOLVED: { icon: <CheckCircle size={10} />, label: "Resolved", color: "#34d399" },
    CLOSED: { icon: <CheckCircle size={10} />, label: "Closed", color: "var(--text-muted)" },
  };
  const { icon, label, color } = config[status];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", color }}>
      {icon}
      <span style={{ fontSize: "11px", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

const STATUS_TABS: { value: TicketStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

// ── Main Component ───────────────────────────────────────────────────────────

export default function AgentDashboardPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "ALL">("ALL");
  const [newTicketIds, setNewTicketIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<Stats>({ total: 0, open: 0, inProgress: 0, resolved: 0, urgent: 0 });
  const [connected, setConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    setError(false);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        api.get("/tickets"),
        api.get("/tickets/stats"),
      ]);
      setTickets(ticketsRes.data);
      setStats({ resolved: 0, ...statsRes.data });
      setLastUpdated(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets(true);
    const socket = connectSocket();
    socket.emit("join:agents");

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("ticket:new", (ticket: TicketRow) => {
      setTickets((prev) => [{ ...ticket, isNew: true }, ...prev]);
      setNewTicketIds((prev) => new Set([...prev, ticket.id]));
      setStats((s) => ({ ...s, total: s.total + 1, open: s.open + 1 }));
      setLastUpdated(new Date());
      setTimeout(() => {
        setNewTicketIds((prev) => {
          const next = new Set(prev);
          next.delete(ticket.id);
          return next;
        });
      }, 4000);
    });

    socket.on("ticket:triaged", (data: { ticketId: string; priority: Priority; category: string; sentiment: number }) => {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === data.ticketId
            ? { ...t, priority: data.priority, category: data.category, sentiment: data.sentiment }
            : t
        )
      );
    });

    socket.on("ticket:updated", (data: { ticketId: string; status: TicketStatus }) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === data.ticketId ? { ...t, status: data.status } : t))
      );
      setLastUpdated(new Date());
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("ticket:new");
      socket.off("ticket:triaged");
      socket.off("ticket:updated");
    };
  }, [fetchTickets]);

  // Filter + search + sort (urgent first)
  const filtered = tickets
    .filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.customer.name.toLowerCase().includes(q) ||
          t.customer.email.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "SELECT") {
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>("input[type='text']")?.focus();
      } else if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < filtered.length) {
        e.preventDefault();
        router.push(`/agent/ticket/${filtered[selectedIndex].id}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filtered, selectedIndex, router]);

  // Reset selection when filters change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [search, statusFilter, priorityFilter]);

  const STAT_CARDS = [
    {
      label: "Total",
      value: stats.total,
      icon: <TicketIcon size={14} />,
      color: "#60a5fa",
      bg: "rgba(59,130,246,0.08)",
    },
    {
      label: "Open",
      value: stats.open,
      icon: <Circle size={14} />,
      color: "#f43f5e",
      bg: "rgba(244,63,94,0.08)",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: <Clock size={14} />,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
    },
    {
      label: "Resolved",
      value: stats.resolved ?? 0,
      icon: <CheckCircle size={14} />,
      color: "#10b981",
      bg: "rgba(16,185,129,0.08)",
    },
    {
      label: "Urgent",
      value: stats.urgent,
      icon: <AlertTriangle size={14} />,
      color: "#fb7185",
      bg: "rgba(244,63,94,0.1)",
      pulse: stats.urgent > 0,
    },
  ];

  return (
    <div className="p-6 md:p-7 h-screen flex flex-col gap-4 overflow-hidden">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            style={{
              fontSize: "18px",
              fontWeight: "700",
              letterSpacing: "-0.025em",
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            Ticket Queue
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            {filtered.length} of {tickets.length} tickets · updated {timeAgo(lastUpdated.toISOString())}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 10px",
              borderRadius: "6px",
              background: connected ? "rgba(16,185,129,0.08)" : "rgba(244,63,94,0.08)",
              border: `1px solid ${connected ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"}`,
              fontSize: "11px",
              fontWeight: 600,
              color: connected ? "#34d399" : "#fb7185",
            }}
          >
            {connected ? (
              <>
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#10b981",
                    animation: "pulse-urgent 2s infinite",
                  }}
                />
                Live
              </>
            ) : (
              <>
                <WifiOff size={11} />
                Offline
              </>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchTickets()}
            className="btn-ghost"
            disabled={refreshing}
            style={{ gap: "6px", fontSize: "12px", padding: "5px 10px" }}
            aria-label="Refresh tickets"
          >
            <RefreshCw
              size={13}
              style={{
                transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
                transform: refreshing ? "rotate(360deg)" : "rotate(0deg)",
              }}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STAT_CARDS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Accent tint */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: s.bg,
                opacity: loading ? 0 : 1,
                transition: "opacity 0.3s",
              }}
            />
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: s.bg,
                color: s.color,
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: loading ? "transparent" : s.label === "Urgent" && s.value > 0 ? s.color : "var(--text-primary)",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {loading ? (
                  <div className="skeleton" style={{ width: "24px", height: "20px", borderRadius: "4px" }} />
                ) : (
                  s.value
                )}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="flex gap-3 items-center flex-wrap">
        {/* Search */}
        <div style={{ position: "relative", flex: 1, maxWidth: "280px" }}>
          <Search
            size={13}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search tickets or customers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "30px", padding: "7px 10px 7px 30px", fontSize: "13px" }}
          />
        </div>

        {/* Status tabs */}
        <div
          role="tablist"
          aria-label="Filter by status"
          style={{
            display: "flex",
            gap: "2px",
            padding: "3px",
            borderRadius: "8px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                role="tab"
                aria-selected={isActive}
                onClick={() => setStatusFilter(tab.value)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "5px",
                  fontSize: "12px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                  background: isActive ? "var(--bg-elevated)" : "transparent",
                  border: isActive ? "1px solid var(--border)" : "1px solid transparent",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Priority filter */}
        <select
          className="input-field"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as any)}
          style={{ width: "auto", padding: "7px 10px", fontSize: "12px", cursor: "pointer" }}
          aria-label="Filter by priority"
        >
          <option value="ALL">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* ── Error state ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: "oklch(0.545 0.205 18 / 0.06)",
              border: "1px solid oklch(0.545 0.205 18 / 0.20)",
              color: "oklch(0.440 0.195 18)",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={14} />
              Could not load tickets. Check your connection.
            </div>
            <button
              onClick={() => fetchTickets()}
              style={{
                background: "none",
                border: "1px solid oklch(0.545 0.205 18 / 0.30)",
                borderRadius: "5px",
                padding: "4px 10px",
                fontSize: "12px",
                color: "oklch(0.440 0.195 18)",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div
        className="glass-card"
        style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        <div style={{ overflow: "auto", flex: 1 }}>
          <table className="data-table" style={{ minWidth: "860px" }}>
            <thead style={{ position: "sticky", top: 0, background: "var(--bg-base)", zIndex: 10 }}>
              <tr>
                <th style={{ width: "30%" }}>Ticket</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Category</th>
                <th>Sentiment</th>
                <th>Msgs</th>
                <th>Assigned</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(7)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((_, j) => (
                      <td key={j}>
                        <div
                          className="skeleton"
                          style={{ height: "12px", borderRadius: "3px", opacity: 0.6 - i * 0.06 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <AnimatePresence initial={false}>
                  {filtered.map((ticket, index) => {
                    const isNew = newTicketIds.has(ticket.id);
                    const isSelected = selectedIndex === index;
                    const rowBg =
                      ticket.priority === "URGENT"
                        ? "row-urgent"
                        : ticket.priority === "HIGH"
                        ? "row-high"
                        : "";

                    return (
                      <motion.tr
                        key={ticket.id}
                        layout
                        initial={isNew ? { opacity: 0, x: -8 } : false}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`${rowBg} ${isNew ? "row-new" : ""}`}
                        onClick={() => router.push(`/agent/ticket/${ticket.id}`)}
                        style={{
                          cursor: "pointer",
                          backgroundColor: isSelected ? "var(--bg-elevated)" : undefined,
                          outline: isSelected ? "1px solid var(--primary)" : undefined,
                          outlineOffset: "-1px",
                        }}
                      >
                        {/* Ticket title + ID */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {isNew && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  fontSize: "8px",
                                  fontWeight: 700,
                                  color: "#60a5fa",
                                  background: "rgba(59,130,246,0.12)",
                                  borderRadius: "3px",
                                  padding: "1px 5px",
                                  letterSpacing: "0.06em",
                                  flexShrink: 0,
                                }}
                              >
                                NEW
                              </span>
                            )}
                            <div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 500,
                                  color: "var(--text-primary)",
                                  maxWidth: "200px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {ticket.title}
                              </div>
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: "var(--text-muted)",
                                  marginTop: "1px",
                                  fontFamily: "monospace",
                                  letterSpacing: "0.02em",
                                }}
                              >
                                #{ticket.id.slice(-7)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Customer */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                            <div
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                background: "rgba(59,130,246,0.12)",
                                border: "1px solid rgba(59,130,246,0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "#60a5fa",
                                flexShrink: 0,
                              }}
                            >
                              {ticket.customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                                {ticket.customer.name}
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                                {ticket.customer.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <StatusBadge status={ticket.status} />
                        </td>

                        {/* Priority */}
                        <td>
                          <PriorityBadge priority={ticket.priority} />
                        </td>

                        {/* Category (AI) */}
                        <td>
                          {ticket.category ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "11px",
                                color: "var(--text-secondary)",
                                padding: "2px 7px",
                                borderRadius: "4px",
                                background: "rgba(139,92,246,0.06)",
                                border: "1px solid rgba(139,92,246,0.15)",
                              }}
                            >
                              <Zap size={8} color="#a78bfa" />
                              {ticket.category}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                              Analyzing…
                            </span>
                          )}
                        </td>

                        {/* Sentiment */}
                        <td>
                          <SentimentChip score={ticket.sentiment} />
                        </td>

                        {/* Message count */}
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              color: ticket._count.messages > 0 ? "var(--text-secondary)" : "var(--text-muted)",
                              fontSize: "11px",
                            }}
                          >
                            <MessageSquare size={11} />
                            {ticket._count.messages}
                          </div>
                        </td>

                        {/* Agent */}
                        <td>
                          {ticket.agent ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <div
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  borderRadius: "50%",
                                  background: "rgba(16,185,129,0.12)",
                                  border: "1px solid rgba(16,185,129,0.2)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "9px",
                                  fontWeight: 700,
                                  color: "#34d399",
                                  flexShrink: 0,
                                }}
                              >
                                {ticket.agent.name.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                                {ticket.agent.name}
                              </span>
                            </div>
                          ) : (
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--text-muted)",
                                fontStyle: "italic",
                              }}
                            >
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Created */}
                        <td>
                          <div
                            style={{ fontSize: "11px", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}
                            title={new Date(ticket.createdAt).toLocaleString("th-TH")}
                          >
                            {timeAgo(ticket.createdAt)}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 24px",
                gap: "10px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                }}
              >
                <InboxIcon size={18} />
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  {search || statusFilter !== "ALL" || priorityFilter !== "ALL"
                    ? "No tickets match your filters"
                    : "Queue is clear"}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "260px" }}>
                  {search || statusFilter !== "ALL" || priorityFilter !== "ALL"
                    ? "Try adjusting your search or filter criteria."
                    : "New tickets will appear here in real time as customers submit requests."}
                </p>
              </div>
              {(search || statusFilter !== "ALL" || priorityFilter !== "ALL") && (
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                    setPriorityFilter("ALL");
                  }}
                  style={{ fontSize: "12px", marginTop: "4px" }}
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* Table footer */}
        {!loading && filtered.length > 0 && (
          <div
            style={{
              padding: "8px 16px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "var(--text-muted)",
              flexShrink: 0,
            }}
          >
            <span>
              Showing {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
              {tickets.length !== filtered.length && ` of ${tickets.length}`}
            </span>
            <span>Sorted by priority · click any row to open</span>
          </div>
        )}
      </div>
    </div>
  );
}
