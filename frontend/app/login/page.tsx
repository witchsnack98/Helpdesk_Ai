"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, UserRole } from "@/store/auth.store";
import {
  Eye,
  EyeOff,
  Zap,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Headphones,
  UserCog,
  BrainCircuit,
  MessageSquareText,
  Lock,
} from "lucide-react";

const ROLE_REDIRECTS: Record<UserRole, string> = {
  CUSTOMER: "/customer/dashboard",
  AGENT: "/agent/dashboard",
  ADMIN: "/admin/knowledge-base",
};

const FEATURES = [
  {
    icon: <BrainCircuit size={16} />,
    title: "AI-Powered Triage",
    desc: "Auto-classify, prioritize, and route tickets before an agent reads them.",
    color: "var(--primary)",
    bg: "oklch(0.520 0.182 258 / 0.08)",
    border: "oklch(0.520 0.182 258 / 0.16)",
  },
  {
    icon: <MessageSquareText size={16} />,
    title: "Real-time Chat",
    desc: "WebSocket-powered live messaging between customers and support agents.",
    color: "var(--accent)",
    bg: "oklch(0.640 0.120 220 / 0.08)",
    border: "oklch(0.640 0.120 220 / 0.16)",
  },
  {
    icon: <Lock size={16} />,
    title: "Secure by Default",
    desc: "JWT auth with HTTP-only cookies and role-based access control throughout.",
    color: "oklch(0.580 0.155 155)",
    bg: "oklch(0.580 0.155 155 / 0.08)",
    border: "oklch(0.580 0.155 155 / 0.16)",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = () => {
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail() || !password) return;
    
    setError("");
    try {
      const user = await login(email, password);
      router.push(ROLE_REDIRECTS[user.role] || "/");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Invalid email or password. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)]">
      {/* ── Left panel — brand story ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px 56px",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
        }}
        className="hidden lg:flex"
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "56px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px oklch(0.520 0.182 258 / 0.28)",
              flexShrink: 0,
            }}
          >
            <Zap size={18} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: "700",
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              AI Helpdesk
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.06em", fontWeight: 500 }}>
              ENTERPRISE SUPPORT
            </div>
          </div>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: "48px" }}>
          <h1
            style={{
              fontSize: "34px",
              fontWeight: "800",
              lineHeight: "1.2",
              letterSpacing: "-0.035em",
              marginBottom: "14px",
              color: "var(--text-primary)",
            }}
          >
            Intelligent support,<br />
            <span style={{ color: "var(--primary)" }}>powered by AI.</span>
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "var(--text-secondary)",
              lineHeight: "1.7",
              maxWidth: "400px",
            }}
          >
            Resolve tickets faster with AI triage, real-time chat, and a
            knowledge base that answers before you ask.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.28 + i * 0.09, duration: 0.3 }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "14px",
                borderRadius: "var(--radius-md)",
                background: f.bg,
                border: `1px solid ${f.border}`,
              }}
            >
              <div
                style={{
                  padding: "7px",
                  borderRadius: "7px",
                  background: f.bg,
                  border: `1px solid ${f.border}`,
                  color: f.color,
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    marginBottom: "2px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {f.title}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.55 }}>
                  {f.desc}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Right panel — login form ──────────────────────────────── */}
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 48px",
          flexShrink: 0,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          style={{ width: "100%" }}
        >
          {/* Mobile logo */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "36px" }}
            className="flex lg:hidden"
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
              }}
            >
              <Zap size={16} color="white" />
            </div>
            <span style={{ fontSize: "15px", fontWeight: "700", letterSpacing: "-0.02em" }}>
              AI Helpdesk
            </span>
          </div>

          <h2
            style={{
              fontSize: "24px",
              fontWeight: "700",
              letterSpacing: "-0.025em",
              marginBottom: "4px",
              color: "var(--text-primary)",
            }}
          >
            Welcome back
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "28px" }}>
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: "14px" }}>
              <label className="label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className={`input-field ${error || emailError ? "error" : ""}`}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                onBlur={validateEmail}
                required
                autoComplete="email"
              />
              <AnimatePresence>
                {emailError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    style={{ fontSize: "11px", color: "var(--color-urgent)", overflow: "hidden" }}
                  >
                    {emailError}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "20px" }}>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  className={`input-field ${error ? "error" : ""}`}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: "42px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    padding: "2px",
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  style={{
                    padding: "10px 13px",
                    borderRadius: "var(--radius-md)",
                    background: "oklch(0.545 0.205 18 / 0.08)",
                    border: "1px solid oklch(0.545 0.205 18 / 0.22)",
                    color: "oklch(0.440 0.195 18)",
                    fontSize: "13px",
                    overflow: "hidden",
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", padding: "11px", fontSize: "14px", justifyContent: "center" }}
              disabled={isLoading || !email || !password || !!emailError}
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="divider" style={{ margin: "22px 0" }} />

          {/* Role quick-reference */}
          <div style={{ marginBottom: "22px" }}>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                textAlign: "center",
                marginBottom: "10px",
                fontWeight: 500,
                letterSpacing: "0.04em",
              }}
            >
              PORTAL ACCESS
            </p>
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                { role: "Customer", icon: <Headphones size={12} />, color: "var(--primary)" },
                { role: "Agent", icon: <UserCog size={12} />, color: "var(--accent)" },
                { role: "Admin", icon: <ShieldCheck size={12} />, color: "oklch(0.580 0.155 155)" },
              ].map((r) => (
                <div
                  key={r.role}
                  style={{
                    flex: 1,
                    padding: "8px 6px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    background: "var(--bg-surface)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <div style={{ color: r.color }}>{r.icon}</div>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500 }}>
                    {r.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}
            >
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
