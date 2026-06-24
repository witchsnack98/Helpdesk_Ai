"use client";

import Sidebar from "@/components/shared/Sidebar";
import AIChatWidget from "@/components/ai/AIChatWidget";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <AIChatWidget />
    </div>
  );
}
