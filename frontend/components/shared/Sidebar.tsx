"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth.store";
import {
  Zap,
  LayoutDashboard,
  Ticket,
  Plus,
  MessageSquare,
  BookOpen,
  Users,
  LogOut,
  ChevronRight,
  Bell,
  Settings,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const CUSTOMER_NAV: NavItem[] = [
  { href: "/customer/dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
  { href: "/customer/ticket/new", label: "New Ticket", icon: <Plus size={17} /> },
];

const AGENT_NAV: NavItem[] = [
  { href: "/agent/dashboard", label: "Ticket Queue", icon: <Ticket size={17} /> },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/knowledge-base", label: "Knowledge Base", icon: <BookOpen size={17} /> },
  { href: "/admin/users", label: "Users", icon: <Users size={17} /> },
];

function getNav(role: string) {
  switch (role) {
    case "CUSTOMER": return CUSTOMER_NAV;
    case "AGENT": return AGENT_NAV;
    case "ADMIN": return ADMIN_NAV;
    default: return [];
  }
}

const ROLE_COLORS: Record<string, string> = {
  CUSTOMER: "#3b82f6",
  AGENT: "#10b981",
  ADMIN: "#a78bfa",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const navItems = getNav(user.role);
  const roleColor = ROLE_COLORS[user.role] || "#3b82f6";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="sidebar">
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid var(--border)",
          marginBottom: "8px",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "9px",
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px oklch(0.520 0.182 258 / 0.30)",
              flexShrink: 0,
            }}
          >
            <Zap size={17} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              AI Helpdesk
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
              ENTERPRISE
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px" }}>
        {/* Role badge */}
        <div
          style={{
            padding: "6px 16px",
            marginBottom: "4px",
            fontSize: "10px",
            fontWeight: "600",
            letterSpacing: "0.06em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
          }}
        >
          {user.role === "CUSTOMER" ? "My Portal" : user.role === "AGENT" ? "Agent Portal" : "Admin Portal"}
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div
                className={`sidebar-item ${isActive ? "active" : ""}`}
                style={{ position: "relative" }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "var(--radius-md)",
                      background: "rgba(59, 130, 246, 0.12)",
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                    }}
                    transition={{ type: "spring", bounce: 0, duration: 0.28 }}
                  />
                )}
                <span
                  style={{
                    color: isActive ? "var(--accent-blue)" : undefined,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {item.icon}
                </span>
                <span style={{ position: "relative", zIndex: 1 }}>{item.label}</span>
                {isActive && (
                  <ChevronRight
                    size={13}
                    style={{ marginLeft: "auto", color: "var(--accent-blue)", position: "relative", zIndex: 1 }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div style={{ padding: "12px", borderTop: "1px solid var(--border)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-elevated)",
            marginBottom: "8px",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: `${roleColor}20`,
              border: `1px solid ${roleColor}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: "700",
              color: roleColor,
              flexShrink: 0,
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.name}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: roleColor,
                fontWeight: "600",
                letterSpacing: "0.04em",
              }}
            >
              {user.role}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn-ghost"
          style={{
            width: "100%",
            justifyContent: "flex-start",
            gap: "8px",
            fontSize: "13px",
            color: "var(--text-muted)",
          }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );
}
