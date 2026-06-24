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
  Check,
} from "lucide-react";

const ROLES: { value: UserRole; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  {
    value: "CUSTOMER",
    label: "Customer",
    icon: <Headphones size={18} />,
    desc: "Submit and track support tickets",
    color: "#3b82f6",
  },
  {
    value: "AGENT",
    label: "Support Agent",
    icon: <UserCog size={18} />,
    desc: "Manage and resolve customer tickets",
    color: "#10b981",
  },
  {
    value: "ADMIN",
    label: "Administrator",
    icon: <ShieldCheck size={18} />,
    desc: "Full system access and AI knowledge base",
    color: "#a78bfa",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();

  const [step, setStep] = useState(1); // 1: info, 2: role
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("CUSTOMER");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setError("");
    try {
      await register(name, email, password, role);
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "radial-gradient(ellipse at 70% 30%, rgba(139,92,246,0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(37,99,235,0.1) 0%, transparent 60%), var(--bg-base)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: "100%",
          maxWidth: "480px",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              boxShadow: "0 8px 24px rgba(59,130,246,0.4)",
            }}
          >
            <Zap size={24} color="white" strokeWidth={2.5} />
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            Create your account
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Join AI Helpdesk — Enterprise Support Platform
          </p>
        </div>

        {/* Step indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "28px",
            gap: "8px",
          }}
        >
          {[1, 2].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: step >= s ? "linear-gradient(135deg, #2563eb, #7c3aed)" : "var(--bg-elevated)",
                  border: step >= s ? "none" : "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.3s ease",
                  boxShadow: step >= s ? "0 4px 12px rgba(59,130,246,0.3)" : "none",
                }}
              >
                {step > s ? (
                  <Check size={13} color="white" />
                ) : (
                  <span style={{ fontSize: "12px", fontWeight: "600", color: step === s ? "white" : "var(--text-muted)" }}>
                    {s}
                  </span>
                )}
              </div>
              <span style={{ fontSize: "12px", color: step >= s ? "var(--text-secondary)" : "var(--text-muted)", fontWeight: step === s ? "600" : "400" }}>
                {s === 1 ? "Account Info" : "Choose Role"}
              </span>
              {s < 2 && (
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: step > s ? "var(--accent-blue)" : "var(--border)",
                    transition: "background 0.3s ease",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: "28px" }}>
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleStep1}
              >
                <div style={{ marginBottom: "16px" }}>
                  <label className="label" htmlFor="reg-name">Full name</label>
                  <input
                    id="reg-name"
                    type="text"
                    className="input-field"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label className="label" htmlFor="reg-email">Email address</label>
                  <input
                    id="reg-email"
                    type="email"
                    className="input-field"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label className="label" htmlFor="reg-pass">Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="reg-pass"
                      type={showPass ? "text" : "password"}
                      className="input-field"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ paddingRight: "44px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                      }}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label className="label" htmlFor="reg-confirm">Confirm password</label>
                  <input
                    id="reg-confirm"
                    type="password"
                    className={`input-field ${error.includes("match") ? "error" : ""}`}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "var(--radius-md)",
                        background: "rgba(244,63,94,0.1)",
                        border: "1px solid rgba(244,63,94,0.25)",
                        color: "#fb7185",
                        fontSize: "13px",
                        marginBottom: "16px",
                      }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" className="btn-primary" style={{ width: "100%", padding: "12px" }}>
                  Continue
                  <ArrowRight size={16} />
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                  Select your role in the organization
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                  {ROLES.map((r) => (
                    <motion.button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "14px 16px",
                        borderRadius: "var(--radius-md)",
                        border: role === r.value
                          ? `1px solid ${r.color}40`
                          : "1px solid var(--border)",
                        background: role === r.value
                          ? `${r.color}10`
                          : "var(--bg-elevated)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "10px",
                          background: role === r.value ? `${r.color}20` : "rgba(255,255,255,0.05)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: role === r.value ? r.color : "var(--text-muted)",
                          flexShrink: 0,
                          transition: "all 0.2s",
                        }}
                      >
                        {r.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: role === r.value ? "var(--text-primary)" : "var(--text-secondary)",
                          }}
                        >
                          {r.label}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{r.desc}</div>
                      </div>
                      {role === r.value && (
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background: r.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Check size={12} color="white" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "var(--radius-md)",
                        background: "rgba(244,63,94,0.1)",
                        border: "1px solid rgba(244,63,94,0.25)",
                        color: "#fb7185",
                        fontSize: "13px",
                        marginBottom: "16px",
                      }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setStep(1)}
                    style={{ flex: 1, padding: "12px" }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    style={{ flex: 2, padding: "12px" }}
                  >
                    {isLoading ? (
                      <><Loader2 size={16} className="animate-spin" /> Creating account...</>
                    ) : (
                      <>Create account <ArrowRight size={16} /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginTop: "20px" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent-blue)", fontWeight: "500", textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
