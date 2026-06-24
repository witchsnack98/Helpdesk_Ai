"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";
import {
  Plus,
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  InboxIcon,
} from "lucide-react";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface TicketItem {
  id: string;
  title: string;
  status: TicketStatus;
  priority: Priority;
  category?: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
  agent?: { name: string; avatar?: string };
}

const STATUS_CONFIG: Record<TicketStatus, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  OPEN:        { label: "Open",        badgeClass: "badge-open",       icon: <AlertCircle size={10} /> },
  IN_PROGRESS: { label: "In Progress", badgeClass: "badge-inprogress", icon: <Clock size={10} /> },
  RESOLVED:    { label: "Resolved",    badgeClass: "badge-resolved",   icon: <CheckCircle size={10} /> },
  CLOSED:      { label: "Closed",      badgeClass: "badge-closed",     icon: <CheckCircle size={10} /> },
};

const PRIORITY_TINT: Record<Priority, { bg: string; border: string }> = {
  URGENT: { bg: "oklch(0.545 0.205 18 / 0.05)", border: "oklch(0.545 0.205 18 / 0.20)" },
  HIGH:   { bg: "oklch(0.620 0.175 38 / 0.04)", border: "oklch(0.620 0.175 38 / 0.18)" },
  MEDIUM: { bg: "transparent", border: "var(--border)" },
  LOW:    { bg: "transparent", border: "var(--border)" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SkeletonCard() {
  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        background: "var(--bg-surface)",
        display: "flex",
        gap: "12px",
        alignItems: "center",
      }}
    >
      <div className="skeleton" style={{ width: "3px", height: "40px", borderRadius: "2px", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: "13px", width: "55%", marginBottom: "8px" }} />
        <div style={{ display: "flex", gap: "6px" }}>
          <div className="skeleton" style={{ height: "18px", width: "64px", borderRadius: "4px" }} />
          <div className="skeleton" style={{ height: "18px", width: "52px", borderRadius: "4px" }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: "48px", height: "12px" }} />
    </div>
  );
}

export default function CustomerDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get("/tickets/my");
      setTickets(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const stats = {
    total:      tickets.length,
    open:       tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    resolved:   tickets.filter((t) => t.status === "RESOLVED").length,
  };

  const STAT_CARDS = [
    { label: "Total",       value: stats.total,      icon: <Ticket size={16} />,      color: "var(--primary)",           bg: "oklch(0.520 0.182 258 / 0.08)", border: "oklch(0.520 0.182 258 / 0.16)" },
    { label: "Open",        value: stats.open,       icon: <AlertCircle size={16} />, color: "var(--color-urgent)",      bg: "oklch(0.545 0.205 18 / 0.07)", border: "oklch(0.545 0.205 18 / 0.18)" },
    { label: "In Progress", value: stats.inProgress, icon: <Clock size={16} />,       color: "oklch(0.500 0.160 55)",    bg: "oklch(0.680 0.160 60 / 0.07)", border: "oklch(0.680 0.160 60 / 0.18)" },
    { label: "Resolved",    value: stats.resolved,   icon: <CheckCircle size={16} />, color: "oklch(0.430 0.140 155)",   bg: "oklch(0.580 0.155 155 / 0.07)", border: "oklch(0.580 0.155 155 / 0.18)" },
  ];

  return (
    <div className="page-enter">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: "20px", fontWeight: "700", letterSpacing: "-0.025em", marginBottom: "3px" }}
          >
            Welcome back, {user?.name}
          </motion.h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Your support tickets · updated {tickets.length > 0 ? timeAgo(tickets[0]?.updatedAt) : "just now"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={fetchTickets}
            className="btn-ghost"
            style={{ gap: "6px", fontSize: "12px" }}
            aria-label="Refresh tickets"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
          <Link href="/customer/ticket/new">
            <button className="btn-primary" style={{ fontSize: "13px" }}>
              <Plus size={15} />
              New Ticket
            </button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {STAT_CARDS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
            style={{
              padding: "14px 16px",
              borderRadius: "var(--radius-lg)",
              background: "var(--bg-base)",
              border: `1px solid ${s.border}`,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "9px",
                background: s.bg,
                border: `1px solid ${s.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: s.color,
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {loading ? <div className="skeleton" style={{ width: "20px", height: "20px", borderRadius: "4px" }} /> : s.value}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <h2
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "var(--text-secondary)",
            letterSpacing: "0.01em",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Ticket size={13} />
          Your Tickets
        </h2>
        {tickets.length > 0 && (
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Error state */}
      <AnimatePresence>
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: "14px 16px",
              borderRadius: "var(--radius-md)",
              background: "oklch(0.545 0.205 18 / 0.06)",
              border: "1px solid oklch(0.545 0.205 18 / 0.20)",
              color: "oklch(0.440 0.195 18)",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={14} />
              Could not load tickets. Check your connection.
            </div>
            <button
              onClick={fetchTickets}
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

      {/* Ticket list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : tickets.length === 0 && !error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: "center",
            padding: "56px 20px",
            borderRadius: "var(--radius-lg)",
            border: "1px dashed var(--border)",
            background: "var(--bg-surface)",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              color: "var(--text-muted)",
            }}
          >
            <InboxIcon size={20} />
          </div>
          <p style={{ color: "var(--text-secondary)", fontWeight: 600, marginBottom: "4px", fontSize: "14px" }}>
            No tickets yet
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "18px" }}>
            Create your first support request and our team will respond shortly.
          </p>
          <Link href="/customer/ticket/new">
            <button className="btn-primary" style={{ fontSize: "13px" }}>
              <Plus size={14} />
              Create First Ticket
            </button>
          </Link>
        </motion.div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {tickets.map((ticket, i) => {
            const statusCfg = STATUS_CONFIG[ticket.status];
            const tint = PRIORITY_TINT[ticket.priority];

            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => router.push(`/customer/ticket/${ticket.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && router.push(`/customer/ticket/${ticket.id}`)}
                aria-label={`Open ticket: ${ticket.title}`}
                style={{
                  padding: "14px 16px",
                  borderRadius: "var(--radius-lg)",
                  border: `1px solid ${tint.border}`,
                  background: tint.bg || "var(--bg-base)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  transition: "all var(--transition-fast)",
                  boxShadow: "var(--shadow-card)",
                  outline: "none",
                }}
                whileHover={{ borderColor: "oklch(0.520 0.182 258 / 0.35)", backgroundColor: "var(--bg-surface)" }}
              >
                {/* Priority dot */}
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    background:
                      ticket.priority === "URGENT" ? "var(--color-urgent)" :
                      ticket.priority === "HIGH"   ? "var(--color-high)" :
                      ticket.priority === "MEDIUM" ? "var(--color-medium)" :
                                                     "var(--color-low)",
                    boxShadow: ticket.priority === "URGENT"
                      ? "0 0 0 3px oklch(0.545 0.205 18 / 0.15)"
                      : undefined,
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "var(--text-primary)",
                      marginBottom: "5px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ticket.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span className={`badge ${statusCfg.badgeClass}`}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                    {ticket.category && (
                      <span
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          padding: "1px 7px",
                          borderRadius: "4px",
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {ticket.category}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                  {ticket._count.messages > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                      }}
                    >
                      <MessageSquare size={11} />
                      {ticket._count.messages}
                    </div>
                  )}
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}
                       title={new Date(ticket.createdAt).toLocaleString()}>
                    {timeAgo(ticket.createdAt)}
                  </div>
                  <ArrowRight size={14} color="var(--text-muted)" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
