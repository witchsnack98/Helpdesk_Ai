"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Zap, Loader2 } from "lucide-react";

const ROLE_REDIRECTS = {
  CUSTOMER: "/customer/dashboard",
  AGENT: "/agent/dashboard",
  ADMIN: "/admin/knowledge-base",
};

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchMe } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      if (!isAuthenticated) {
        await fetchMe();
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(ROLE_REDIRECTS[user.role] || "/login");
    } else if (!isAuthenticated) {
      const timer = setTimeout(() => router.replace("/login"), 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        gap: "14px",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          background: "var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px oklch(0.520 0.182 258 / 0.28)",
        }}
      >
        <Zap size={22} color="white" strokeWidth={2.5} />
      </div>
      <Loader2 size={18} color="var(--text-muted)" className="animate-spin" />
      <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "Geist, sans-serif" }}>Loading your workspace…</p>
    </div>
  );
}
