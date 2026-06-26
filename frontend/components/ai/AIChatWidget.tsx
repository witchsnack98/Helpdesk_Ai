"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Zap,
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMsg = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
    const aiMsgId = Date.now().toString() + "ai";

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: aiMsgId, role: "ai", content: "" },
    ]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Network response was not ok");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        setLoading(false);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? { ...msg, content: msg.content + chunk }
                : msg,
            ),
          );
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                content:
                  "ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่โดยตรง",
              }
            : msg,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={22} color="white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle size={22} color="white" />
            </motion.div>
          )}
        </AnimatePresence>
        {!open && (
          <span className="absolute inset-0 rounded-full border-2 border-blue-500/40 animate-[pulse-urgent_2s_infinite]" />
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
            className="fixed bottom-[92px] right-6 w-[360px] rounded-[var(--radius-xl)] overflow-hidden flex flex-col z-[100] border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[0_24px_64px_rgba(0,0,0,0.5),0_0_40px_rgba(59,130,246,0.1)]"
            style={{ height: 520 }}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-br from-blue-600/90 to-purple-600/90 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Zap size={17} color="white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-white leading-tight">
                  AI Support Assistant
                </div>
                <div className="text-[10px] text-white/70 flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  Powered by Gemini · Available 24/7
                </div>
              </div>
              <Link href="/customer/ticket/new" className="shrink-0">
                <button className="bg-white/15 border border-white/20 rounded-lg px-2.5 py-1.5 cursor-pointer text-white text-[10px] flex items-center gap-1 hover:bg-white/25 transition-colors">
                  <ExternalLink size={10} />
                  Open Ticket
                </button>
              </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3.5 py-4 flex flex-col gap-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* AI avatar spacer — keeps bubbles aligned */}
                  {msg.role === "ai" && (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mb-0.5">
                      <Zap size={11} color="white" />
                    </div>
                  )}

                  <div
                    className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"} max-w-[78%]`}
                  >
                    {msg.role === "ai" && (
                      <span className="text-[9px] text-purple-400 px-1 flex items-center gap-1">
                        <Zap size={8} /> AI Answer
                      </span>
                    )}
                    <div
                      className={`${msg.role === "user" ? "bubble-customer" : "bubble-ai"} text-[12.5px] leading-relaxed px-3 py-2`}
                    >
                      {msg.content ||
                        (msg.role === "ai" && loading && (
                          <div className="flex gap-1 py-0.5">
                            <div className="typing-dot" />
                            <div className="typing-dot" />
                            <div className="typing-dot" />
                          </div>
                        ))}
                    </div>
                  </div>
                </motion.div>
              ))}

              {loading && messages[messages.length - 1]?.role !== "ai" && (
                <div className="flex items-end gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Zap size={11} color="white" />
                  </div>
                  <div className="bubble-ai px-3 py-2.5">
                    <div className="flex gap-1">
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
            <div className="px-3.5 py-3 border-t border-[var(--border)] flex gap-2 items-center shrink-0 bg-[var(--bg-surface)]">
              <input
                ref={inputRef}
                type="text"
                className="input-field flex-1 px-3 py-2 text-[12.5px]"
                placeholder="Ask anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="btn-primary px-3 py-2 shrink-0"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
