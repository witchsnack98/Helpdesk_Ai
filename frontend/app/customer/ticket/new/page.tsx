"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Upload,
  X,
  Check,
  ImageIcon,
  FileText,
  AlertCircle,
  Send,
} from "lucide-react";
import Link from "next/link";

type Step = 1 | 2 | 3;

const STEP_LABELS = ["Describe Issue", "Add Evidence", "Review & Submit"];

export default function NewTicketPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    const valid = Array.from(newFiles)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 5);
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
    valid.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string].slice(0, 5));
      };
      reader.readAsDataURL(f);
    });
  }, []);

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const imageUrls: string[] = [];

      // Upload images if any
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        // In real app, upload to storage. For now, skip or use placeholder
        // const res = await api.post("/storage/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
        // imageUrls.push(res.data.url);
      }

      const res = await api.post("/tickets", {
        title,
        description,
        imageUrls,
      });

      router.push(`/customer/ticket/${res.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create ticket. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="page-enter" style={{ maxWidth: "640px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
        <Link href="/customer/dashboard">
          <button className="btn-ghost" style={{ padding: "6px 10px" }}>
            <ArrowLeft size={16} />
          </button>
        </Link>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "700", letterSpacing: "-0.02em" }}>
            Create Support Ticket
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
            Our AI will analyze and prioritize your request automatically
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "28px" }}>
        {STEP_LABELS.map((label, i) => {
          const s = (i + 1) as Step;
          const isDone = step > s;
          const isActive = step === s;
          return (
            <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "none" }}>
                <div
                  style={{
                    width: "30px", height: "30px", borderRadius: "50%",
                    background: isDone
                      ? "var(--accent-emerald)"
                      : isActive
                      ? "linear-gradient(135deg, #2563eb, #7c3aed)"
                      : "var(--bg-elevated)",
                    border: isDone || isActive ? "none" : "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.3s",
                    flexShrink: 0,
                    boxShadow: isActive ? "0 4px 14px rgba(59,130,246,0.35)" : "none",
                  }}
                >
                  {isDone ? (
                    <Check size={14} color="white" />
                  ) : (
                    <span style={{ fontSize: "12px", fontWeight: "600", color: isActive ? "white" : "var(--text-muted)" }}>
                      {s}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "12px", fontWeight: isActive ? "600" : "400", color: isActive ? "var(--text-primary)" : isDone ? "var(--text-secondary)" : "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {label}
                </span>
              </div>
              {s < 3 && (
                <div style={{ flex: 1, height: "1px", background: step > s ? "var(--accent-blue)" : "var(--border)", margin: "0 10px", transition: "background 0.3s" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="glass-card" style={{ padding: "28px" }}>
        <AnimatePresence mode="wait">

          {/* Step 1: Issue Info */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div style={{ marginBottom: "18px" }}>
                <label className="label" htmlFor="ticket-title">
                  Issue Title <span style={{ color: "var(--accent-rose)" }}>*</span>
                </label>
                <input
                  id="ticket-title"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Cannot login to my account"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>
                  {title.length}/200
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label className="label" htmlFor="ticket-desc">
                  Detailed Description <span style={{ color: "var(--accent-rose)" }}>*</span>
                </label>
                <textarea
                  id="ticket-desc"
                  className="input-field"
                  placeholder="Describe your issue in detail. Include what you were doing, what happened, and what you expected to happen..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  maxLength={5000}
                  style={{ resize: "vertical" }}
                />
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>
                  {description.length}/5000
                </div>
              </div>

              {/* AI Triage notice */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(139,92,246,0.08)",
                  border: "1px solid rgba(139,92,246,0.2)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                <AlertCircle size={15} color="#a78bfa" style={{ flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#c4b5fd", marginBottom: "2px" }}>
                    AI-Powered Triage
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.6" }}>
                    Our AI will automatically analyze your issue, classify the category, and set the priority level. Urgent issues are escalated immediately.
                  </div>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={() => step === 1 && title.trim().length >= 5 && description.trim().length >= 10 && setStep(2)}
                disabled={title.trim().length < 5 || description.trim().length < 10}
                style={{ width: "100%", padding: "12px" }}
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* Step 2: File Upload */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                Upload screenshots or images that help describe your issue (optional, max 5 files)
              </p>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => document.getElementById("file-input")?.click()}
                style={{
                  border: `2px dashed ${dragOver ? "var(--accent-blue)" : "var(--border)"}`,
                  borderRadius: "var(--radius-lg)",
                  padding: "32px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragOver ? "rgba(59,130,246,0.05)" : "var(--bg-elevated)",
                  transition: "all var(--transition-fast)",
                  marginBottom: "16px",
                }}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <Upload size={28} color={dragOver ? "var(--accent-blue)" : "var(--text-muted)"} style={{ margin: "0 auto 10px" }} />
                <div style={{ fontSize: "13px", color: dragOver ? "var(--accent-blue)" : "var(--text-secondary)", fontWeight: "500", marginBottom: "4px" }}>
                  {dragOver ? "Drop files here" : "Click to upload or drag & drop"}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>PNG, JPG, GIF up to 10MB · Max 5 files</div>
              </div>

              {/* Previews */}
              {previews.length > 0 && (
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
                  {previews.map((src, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img
                        src={src}
                        alt={`Preview ${i + 1}`}
                        style={{
                          width: "80px", height: "80px",
                          objectFit: "cover",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border)",
                        }}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        style={{
                          position: "absolute",
                          top: "-6px", right: "-6px",
                          width: "18px", height: "18px",
                          borderRadius: "50%",
                          background: "var(--accent-rose)",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X size={11} color="white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn-secondary" onClick={() => setStep(1)} style={{ flex: 1, padding: "12px" }}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="btn-primary" onClick={() => setStep(3)} style={{ flex: 2, padding: "12px" }}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "14px", color: "var(--text-secondary)" }}>
                Review your ticket before submitting
              </h3>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  marginBottom: "16px",
                }}
              >
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                  Title
                </div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "14px" }}>{title}</div>

                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                  Description
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.7", marginBottom: previews.length ? "14px" : "0" }}>
                  {description}
                </div>

                {previews.length > 0 && (
                  <>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                      Attachments ({previews.length})
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {previews.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt={`Attachment ${i + 1}`}
                          style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border)" }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* AI Triage reminder */}
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  fontSize: "12px",
                  color: "#34d399",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Check size={13} />
                AI will automatically analyze and prioritize this ticket upon submission
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
                <button className="btn-secondary" onClick={() => setStep(2)} style={{ flex: 1, padding: "12px" }} disabled={submitting}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="btn-primary" onClick={handleSubmit} style={{ flex: 2, padding: "12px" }} disabled={submitting}>
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                  ) : (
                    <><Send size={16} /> Submit Ticket</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
