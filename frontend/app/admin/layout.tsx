"use client";

import Sidebar from "@/components/shared/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          marginLeft: "240px",
          padding: "32px",
          minHeight: "100vh",
          background: "var(--bg-base)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
