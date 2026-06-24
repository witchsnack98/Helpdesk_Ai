"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import {
  Upload,
  FileText,
  Trash2,
  CheckCircle,
  Loader2,
  XCircle,
  BookOpen,
  RefreshCw,
  Database,
  Zap,
  AlertTriangle,
} from "lucide-react";

type EmbedStatus = "PROCESSING" | "SUCCESS" | "FAILED";

interface KnowledgeDoc {
  id: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  status: EmbedStatus;
  chunkCount?: number;
  createdAt: string;
}

function StatusBadge({ status }: { status: EmbedStatus }) {
  const configs = {
    PROCESSING: {
      icon: <Loader2 size={12} className="animate-spin" />,
      label: "Processing",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.25)",
    },
    SUCCESS: {
      icon: <CheckCircle size={12} />,
      label: "Embedded",
      color: "#10b981",
      bg: "rgba(16,185,129,0.12)",
      border: "rgba(16,185,129,0.25)",
    },
    FAILED: {
      icon: <XCircle size={12} />,
      label: "Failed",
      color: "#f43f5e",
      bg: "rgba(244,63,94,0.12)",
      border: "rgba(244,63,94,0.25)",
    },
  };
  const cfg = configs[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: "600",
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgeBasePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const fetchDocs = async () => {
    try {
      const res = await api.get("/knowledge-base");
      setDocs(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDocs();

    // Real-time embedding status updates
    const socket = connectSocket();
    socket.on("embed:status", (data: { docId: string; status: EmbedStatus; chunkCount?: number }) => {
      setDocs((prev) =>
        prev.map((d) =>
          d.id === data.docId
            ? { ...d, status: data.status, chunkCount: data.chunkCount ?? d.chunkCount }
            : d
        )
      );
    });

    return () => { socket.off("embed:status"); };
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are accepted.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError("File size must be under 20MB.");
      return;
    }
    setUploadError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/knowledge-base/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDocs((prev) => [res.data, ...prev]);
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document and all its embeddings?")) return;
    try {
      await api.delete(`/knowledge-base/${id}`);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {}
  };

  const stats = {
    total: docs.length,
    success: docs.filter((d) => d.status === "SUCCESS").length,
    processing: docs.filter((d) => d.status === "PROCESSING").length,
    totalChunks: docs.reduce((acc, d) => acc + (d.chunkCount ?? 0), 0),
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", letterSpacing: "-0.02em", marginBottom: "4px" }}>
            Knowledge Base
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Upload PDF documents to power the AI RAG Chatbot
          </p>
        </div>
        <button onClick={fetchDocs} className="btn-ghost" style={{ fontSize: "13px", gap: "6px" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Documents", value: stats.total, icon: <FileText size={18} />, color: "#3b82f6" },
          { label: "Embedded", value: stats.success, icon: <CheckCircle size={18} />, color: "#10b981" },
          { label: "Processing", value: stats.processing, icon: <Loader2 size={18} className={stats.processing > 0 ? "animate-spin" : ""} />, color: "#f59e0b" },
          { label: "Total Chunks", value: stats.totalChunks, icon: <Database size={18} />, color: "#a78bfa" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div style={{ color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", alignItems: "start" }}>
        {/* Documents Table */}
        <div>
          <div className="glass-card" style={{ overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <Loader2 size={24} className="animate-spin" color="var(--text-muted)" style={{ margin: "0 auto" }} />
              </div>
            ) : docs.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <BookOpen size={36} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "4px" }}>No documents yet</p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Upload PDF files to populate the AI knowledge base</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Size</th>
                    <th>Status</th>
                    <th>Chunks</th>
                    <th>Uploaded</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {docs.map((doc) => (
                      <motion.tr
                        key={doc.id}
                        layout
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "34px", height: "34px", borderRadius: "8px",
                                background: "rgba(244,63,94,0.12)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <FileText size={16} color="#fb7185" />
                            </div>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {doc.filename}
                              </div>
                              <div style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--text-muted)" }}>
                                #{doc.id.slice(-8)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatBytes(doc.fileSize)}</span>
                        </td>
                        <td>
                          <StatusBadge status={doc.status} />
                        </td>
                        <td>
                          {doc.status === "SUCCESS" && doc.chunkCount ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <Zap size={11} color="#a78bfa" />
                              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{doc.chunkCount}</span>
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {new Date(doc.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="btn-ghost"
                            style={{ padding: "6px", color: "var(--accent-rose)" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Upload Panel */}
        <div>
          <div className="glass-card" style={{ padding: "20px" }}>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "var(--text-secondary)",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Upload size={14} />
              Upload Document
            </h3>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleUpload(file);
              }}
              onClick={() => !uploading && document.getElementById("kb-file-input")?.click()}
              style={{
                border: `2px dashed ${dragOver ? "var(--accent-blue)" : uploading ? "rgba(139,92,246,0.4)" : "var(--border)"}`,
                borderRadius: "var(--radius-lg)",
                padding: "28px 16px",
                textAlign: "center",
                cursor: uploading ? "not-allowed" : "pointer",
                background: dragOver
                  ? "rgba(59,130,246,0.05)"
                  : uploading
                  ? "rgba(139,92,246,0.05)"
                  : "var(--bg-elevated)",
                transition: "all var(--transition-fast)",
                marginBottom: "12px",
              }}
            >
              <input
                id="kb-file-input"
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: "none" }}
                onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }}
                disabled={uploading}
              />

              {uploading ? (
                <>
                  <Loader2 size={28} className="animate-spin" color="#a78bfa" style={{ margin: "0 auto 10px" }} />
                  <div style={{ fontSize: "13px", color: "#a78bfa", fontWeight: "500" }}>
                    Uploading & Processing...
                  </div>
                </>
              ) : (
                <>
                  <FileText size={28} color={dragOver ? "var(--accent-blue)" : "var(--text-muted)"} style={{ margin: "0 auto 10px" }} />
                  <div style={{ fontSize: "13px", color: dragOver ? "var(--accent-blue)" : "var(--text-secondary)", fontWeight: "500", marginBottom: "4px" }}>
                    {dragOver ? "Drop PDF here" : "Click or drag PDF to upload"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>PDF only · Max 20MB</div>
                </>
              )}
            </div>

            <AnimatePresence>
              {uploadError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(244,63,94,0.1)",
                    border: "1px solid rgba(244,63,94,0.25)",
                    color: "#fb7185",
                    fontSize: "12px",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <AlertTriangle size={13} />
                  {uploadError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pipeline info */}
            <div style={{ marginTop: "12px" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                Embedding Pipeline
              </div>
              {[
                { step: "1", label: "Parse PDF text", color: "#3b82f6" },
                { step: "2", label: "Chunk into segments", color: "#10b981" },
                { step: "3", label: "Generate embeddings (Gemini)", color: "#a78bfa" },
                { step: "4", label: "Store in pgvector DB", color: "#f59e0b" },
              ].map((s) => (
                <div key={s.step} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px" }}>
                  <div
                    style={{
                      width: "20px", height: "20px", borderRadius: "50%",
                      background: `${s.color}18`, border: `1px solid ${s.color}35`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "9px", fontWeight: "700", color: s.color, flexShrink: 0,
                    }}
                  >
                    {s.step}
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
