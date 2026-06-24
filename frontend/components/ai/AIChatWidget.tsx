"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Zap,
  Minimize2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface ChatMsg {
  id: string;
  role: "user" | "ai";
  content: string;
}

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "ai",
      content:
        "สวัสดีครับ! ผมคือ AI Assistant ยินดีช่วยตอบคำถามเกี่ยวกับบริการของเรา หรือกรุณาอธิบายปัญหาที่พบ 😊",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", { message: userMsg.content });
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "ai", role: "ai", content: res.data.answer },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "err",
          role: "ai",
          content: "ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่โดยตรง",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="chat-widget-btn"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI Support Chat"
        id="ai-chat-widget-btn"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} color="white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle size={22} color="white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring when closed */}
        {!open && (
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "2px solid rgba(59,130,246,0.4)",
              animation: "pulse-urgent 2s infinite",
            }}
          />
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: "fixed",
              bottom: "92px",
              right: "24px",
              width: "340px",
              height: "480px",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              zIndex: 100,
              border: "1px solid var(--border-strong)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 40px rgba(59,130,246,0.1)",
              background: "var(--bg-surface)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "14px 16px",
                background: "linear-gradient(135deg, rgba(37,99,235,0.9), rgba(124,58,237,0.9))",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Zap size={16} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "white" }}>AI Support Assistant</div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10b981" }} />
                  Powered by Gemini · Available 24/7
                </div>
              </div>
              <Link href="/customer/ticket/new">
                <button
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    padding: "5px 8px",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ExternalLink size={11} />
                  Open Ticket
                </button>
              </Link>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "14px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    className={msg.role === "user" ? "bubble-customer" : "bubble-ai"}
                    style={{ fontSize: "12px", lineHeight: "1.6", padding: "9px 12px", maxWidth: "85%" }}
                  >
                    {msg.role === "ai" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px", fontSize: "9px", color: "#a78bfa" }}>
                        <Zap size={9} /> AI Answer
                      </div>
                    )}
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div className="bubble-ai" style={{ padding: "9px 12px" }}>
                    <div className="typing-indicator">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: "10px 12px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                gap: "8px",
                alignItems: "center",
                flexShrink: 0,
                background: "var(--bg-surface)",
              }}
            >
              <input
                type="text"
                className="input-field"
                placeholder="Ask anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ flex: 1, padding: "8px 12px", fontSize: "12px" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="btn-primary"
                style={{ padding: "8px 12px", flexShrink: 0 }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
