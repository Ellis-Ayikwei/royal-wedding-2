"use client";

import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, useEffect, useState, createContext, useContext, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, AlertCircle, X, Loader2, Inbox } from "lucide-react";

/* ---------- Toasts ---------- */
interface Toast { id: number; message: string; tone: "success" | "error" }
const ToastCtx = createContext<{ push: (m: string, t?: "success" | "error") => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2" role="status" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-sm border text-sm shadow-lg ${
                t.tone === "success"
                  ? "bg-emerald-800 border-emerald-400/40 text-ivory-50"
                  : "bg-rose-950 border-rose-400/40 text-rose-100"
              }`}
            >
              {t.tone === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Form controls ---------- */
export function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[11px] tracking-[0.15em] uppercase text-ivory-100/55 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const controlCls =
  "w-full bg-navy-950 border border-gold-400/20 rounded-sm px-3.5 py-2.5 text-sm text-ivory-50 placeholder:text-ivory-100/25 focus:outline-none focus:border-gold-300 transition-colors";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={`${controlCls} ${className}`} {...rest} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return <textarea className={`${controlCls} resize-none ${className}`} {...rest} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <select className={`${controlCls} ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function AdminButton({ children, className = "", variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-gradient-to-b from-gold-300 to-gold-500 text-navy-950 hover:shadow-[0_4px_18px_rgba(201,162,75,0.3)]",
    ghost: "border border-gold-400/30 text-gold-200 hover:bg-gold-300/10",
    danger: "border border-rose-400/40 text-rose-200 hover:bg-rose-500/10",
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm text-[11px] font-medium tracking-[0.15em] uppercase transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------- States ---------- */
export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-ivory-100/50 gap-3">
      <Loader2 className="animate-spin text-gold-300" size={26} />
      <p className="text-xs tracking-[0.2em] uppercase">{label}</p>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3 border border-dashed border-gold-400/20 rounded-sm">
      <Inbox className="text-gold-400/50" size={28} />
      <p className="font-display text-lg text-ivory-50">{title}</p>
      <p className="text-sm text-ivory-100/50 max-w-sm">{hint}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3 border border-rose-400/25 bg-rose-500/5 rounded-sm">
      <AlertCircle className="text-rose-300" size={26} />
      <p className="text-sm text-rose-100">{message}</p>
      {onRetry && <AdminButton variant="ghost" onClick={onRetry}>Try again</AdminButton>}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-navy-950/85 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto bg-navy-900 border border-gold-400/25 rounded-md"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold-400/15">
          <h3 className="font-display text-lg text-ivory-50">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-ivory-100/50 hover:text-gold-300">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
}

export function ConfirmDialog({ title, body, confirmLabel = "Delete", onConfirm, onCancel }: { title: string; body: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-ivory-100/70 leading-relaxed">{body}</p>
      <div className="mt-6 flex gap-3 justify-end">
        <AdminButton variant="ghost" onClick={onCancel}>Cancel</AdminButton>
        <AdminButton variant="danger" onClick={onConfirm}>{confirmLabel}</AdminButton>
      </div>
    </Modal>
  );
}
