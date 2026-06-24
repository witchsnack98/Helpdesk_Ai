"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Users as UsersIcon, AlertTriangle, Search, ShieldCheck, Headphones, UserCog } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "AGENT" | "ADMIN";
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-enter" style={{ display: "flex", flexDirection: "column", height: "100%", gap: "16px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px", color: "var(--text-primary)" }}>
            User Management
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Manage customers, support agents, and system administrators.
          </p>
        </div>
      </div>

      {/* Error state */}
      <AnimatePresence>
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: "12px 16px",
              background: "oklch(0.545 0.205 18 / 0.08)",
              border: "1px solid oklch(0.545 0.205 18 / 0.2)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-urgent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "13px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 500 }}>
              <AlertTriangle size={16} /> 
              Failed to load users from the server.
            </div>
            <button 
              onClick={fetchUsers} 
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

      {/* Search Bar */}
      <div style={{ position: "relative", maxWidth: "320px" }}>
        <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input 
          type="text" 
          placeholder="Search by name, email, or role..." 
          className="input-field" 
          style={{ paddingLeft: "34px", fontSize: "13px", padding: "8px 10px 8px 34px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="glass-card" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ overflow: "auto", flex: 1 }}>
          <table className="data-table" style={{ minWidth: "700px" }}>
            <thead style={{ position: "sticky", top: 0, background: "var(--bg-base)", zIndex: 10 }}>
              <tr>
                <th style={{ width: "50%" }}>User Details</th>
                <th>Role Access</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                         <div className="skeleton" style={{ height: "32px", width: "32px", borderRadius: "50%" }} />
                         <div>
                            <div className="skeleton" style={{ height: "14px", width: "120px", marginBottom: "6px" }} />
                            <div className="skeleton" style={{ height: "10px", width: "180px" }} />
                         </div>
                      </div>
                    </td>
                    <td><div className="skeleton" style={{ height: "20px", width: "70px", borderRadius: "4px" }} /></td>
                    <td><div className="skeleton" style={{ height: "14px", width: "90px" }} /></td>
                  </tr>
                ))
              ) : (
                <AnimatePresence>
                  {filtered.map((user) => {
                    const roleConfig = {
                      ADMIN: { color: "oklch(0.580 0.155 155)", bg: "oklch(0.580 0.155 155 / 0.1)", border: "oklch(0.580 0.155 155 / 0.2)", icon: <ShieldCheck size={12} /> },
                      AGENT: { color: "var(--accent)", bg: "oklch(0.640 0.120 220 / 0.1)", border: "oklch(0.640 0.120 220 / 0.2)", icon: <UserCog size={12} /> },
                      CUSTOMER: { color: "var(--primary)", bg: "oklch(0.520 0.182 258 / 0.1)", border: "oklch(0.520 0.182 258 / 0.2)", icon: <Headphones size={12} /> },
                    };
                    const rConf = roleConfig[user.role] || roleConfig.CUSTOMER;

                    return (
                      <motion.tr 
                        key={user.id} 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                      >
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div 
                              style={{ 
                                width: "36px", 
                                height: "36px", 
                                borderRadius: "50%", 
                                background: "var(--bg-elevated)", 
                                border: "1px solid var(--border)", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                fontSize: "13px", 
                                fontWeight: 700, 
                                color: "var(--text-secondary)" 
                              }}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{user.name}</div>
                              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span 
                            style={{ 
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 600,
                              background: rConf.bg, 
                              color: rConf.color,
                              border: `1px solid ${rConf.border}`,
                              letterSpacing: "0.02em"
                            }}
                          >
                            {rConf.icon}
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                            {new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
          
          {!loading && filtered.length === 0 && (
             <div style={{ padding: "60px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
               <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                 <UsersIcon size={20} />
               </div>
               <div>
                 <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>No users found</div>
                 <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Try adjusting your search filters</div>
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
