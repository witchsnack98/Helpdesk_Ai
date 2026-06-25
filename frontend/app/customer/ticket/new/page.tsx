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
  AlertCircle,
  Send,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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

      for (const file of files) {
        // Request presigned URL
        const res = await api.post("/tickets/upload-url", {
          filename: file.name,
          contentType: file.type,
        });
        
        const { uploadUrl, publicUrl } = res.data;

        // Upload directly to Supabase using fetch (bypass axios auth interceptors)
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        imageUrls.push(publicUrl);
      }

      const res = await api.post("/tickets", {
        title,
        description,
        imageUrls,
      });

      router.push(`/customer/ticket/${res.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to create ticket. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="page-enter max-w-[640px] mx-auto p-6 lg:p-10">
      {/* Header */}
      <div className="flex items-center gap-3.5 mb-7">
        <Link href="/customer/dashboard">
          <button className="btn-ghost px-2.5 py-1.5">
            <ArrowLeft size={16} />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Create Support Ticket
          </h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
            Our AI will analyze and prioritize your request automatically
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-7">
        {STEP_LABELS.map((label, i) => {
          const s = (i + 1) as Step;
          const isDone = step > s;
          const isActive = step === s;
          return (
            <div key={s} className="flex-1 flex items-center">
              <div className="flex items-center gap-2 flex-none">
                <div
                  className={`w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isDone
                      ? "bg-[var(--accent-emerald)] border-none"
                      : isActive
                      ? "bg-gradient-to-br from-blue-600 to-purple-600 border-none shadow-[0_4px_14px_rgba(59,130,246,0.35)]"
                      : "bg-[var(--bg-elevated)] border border-[var(--border)]"
                  }`}
                >
                  {isDone ? (
                    <Check size={14} color="white" />
                  ) : (
                    <span className={`text-xs font-semibold ${isActive ? "text-white" : "text-[var(--text-muted)]"}`}>
                      {s}
                    </span>
                  )}
                </div>
                <span className={`text-xs whitespace-nowrap ${isActive ? "font-semibold text-[var(--text-primary)]" : isDone ? "font-normal text-[var(--text-secondary)]" : "font-normal text-[var(--text-muted)]"}`}>
                  {label}
                </span>
              </div>
              {s < 3 && (
                <div className={`flex-1 h-px mx-2.5 transition-colors duration-300 ${step > s ? "bg-blue-500" : "bg-[var(--border)]"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="glass-card p-7">
        <AnimatePresence mode="wait">

          {/* Step 1: Issue Info */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-4.5">
                <label className="label block mb-1.5" htmlFor="ticket-title">
                  Issue Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="ticket-title"
                  type="text"
                  className="input-field w-full px-3.5 py-2.5"
                  placeholder="e.g. Cannot login to my account"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
                <div className="text-[11px] text-[var(--text-muted)] mt-1 text-right">
                  {title.length}/200
                </div>
              </div>

              <div className="mb-5">
                <label className="label block mb-1.5" htmlFor="ticket-desc">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="ticket-desc"
                  className="input-field w-full px-3.5 py-2.5 resize-y"
                  placeholder="Describe your issue in detail. Include what you were doing, what happened, and what you expected to happen..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  maxLength={5000}
                />
                <div className="text-[11px] text-[var(--text-muted)] mt-1 text-right">
                  {description.length}/5000
                </div>
              </div>

              {/* AI Triage notice */}
              <div className="px-3.5 py-3 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-start gap-2.5 mb-5">
                <AlertCircle size={15} className="text-purple-400 shrink-0 mt-[1px]" />
                <div>
                  <div className="text-xs font-semibold text-purple-300 mb-0.5">
                    AI-Powered Triage
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Our AI will automatically analyze your issue, classify the category, and set the priority level. Urgent issues are escalated immediately.
                  </div>
                </div>
              </div>

              <button
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                onClick={() => step === 1 && title.trim().length >= 5 && description.trim().length >= 10 && setStep(2)}
                disabled={title.trim().length < 5 || description.trim().length < 10}
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
              <p className="text-[13px] text-[var(--text-muted)] mb-4">
                Upload screenshots or images that help describe your issue (optional, max 5 files)
              </p>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => document.getElementById("file-input")?.click()}
                className={`border-2 dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 mb-4 ${dragOver ? "border-blue-500 bg-blue-500/5" : "border-[var(--border)] bg-[var(--bg-elevated)]"}`}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <Upload size={28} className={`mx-auto mb-2.5 ${dragOver ? "text-blue-500" : "text-[var(--text-muted)]"}`} />
                <div className={`text-[13px] font-medium mb-1 ${dragOver ? "text-blue-500" : "text-[var(--text-secondary)]"}`}>
                  {dragOver ? "Drop files here" : "Click to upload or drag & drop"}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">PNG, JPG, GIF up to 10MB · Max 5 files</div>
              </div>

              {/* Previews */}
              {previews.length > 0 && (
                <div className="flex gap-2.5 flex-wrap mb-5">
                  {previews.map((src, i) => (
                    <div key={i} className="relative">
                      <Image
                        src={src}
                        alt={`Preview ${i + 1}`}
                        width={80}
                        height={80}
                        unoptimized
                        className="object-cover rounded-lg border border-[var(--border)] w-20 h-20"
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-rose-500 border-none cursor-pointer flex items-center justify-center"
                      >
                        <X size={11} color="white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2.5">
                <button className="btn-secondary flex-1 py-3 flex items-center justify-center gap-1.5" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="btn-primary flex-[2] py-3 flex items-center justify-center gap-1.5" onClick={() => setStep(3)}>
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
              <h3 className="text-sm font-semibold mb-3.5 text-[var(--text-secondary)]">
                Review your ticket before submitting
              </h3>

              <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] mb-4">
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Title
                </div>
                <div className="text-sm font-semibold text-[var(--text-primary)] mb-3.5">{title}</div>

                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Description
                </div>
                <div className={`text-[13px] text-[var(--text-secondary)] leading-relaxed ${previews.length ? "mb-3.5" : "mb-0"}`}>
                  {description}
                </div>

                {previews.length > 0 && (
                  <>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">
                      Attachments ({previews.length})
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {previews.map((src, i) => (
                        <Image
                          key={i}
                          src={src}
                          alt={`Attachment ${i + 1}`}
                          width={60}
                          height={60}
                          unoptimized
                          className="object-cover rounded-lg border border-[var(--border)] w-[60px] h-[60px]"
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* AI Triage reminder */}
              <div className="px-3.5 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-5 flex items-center gap-2">
                <Check size={13} />
                AI will automatically analyze and prioritize this ticket upon submission
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-3.5 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-[13px] text-rose-400 mb-4"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2.5">
                <button className="btn-secondary flex-1 py-3 flex items-center justify-center gap-1.5" onClick={() => setStep(2)} disabled={submitting}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="btn-primary flex-[2] py-3 flex items-center justify-center gap-1.5" onClick={handleSubmit} disabled={submitting}>
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
