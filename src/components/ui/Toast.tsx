"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: ToastAction;
  duration?: number; // ms, 0 = persistent
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, "id">) => string;
  success: (title: string, message?: string, action?: ToastAction) => string;
  error: (title: string, message?: string, action?: ToastAction) => string;
  warning: (title: string, message?: string, action?: ToastAction) => string;
  info: (title: string, message?: string, action?: ToastAction) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ── Context ────────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

// ── Individual Toast Item ──────────────────────────────────────────────────────
function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const duration = t.duration ?? (t.type === "error" ? 6000 : 4500);

  // Slide in
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Progress bar countdown
  useEffect(() => {
    if (duration === 0) return; // persistent
    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        handleDismiss();
      }
    }, 30);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(t.id), 300);
  };

  const config: Record<ToastType, { icon: React.ReactNode; bg: string; border: string; titleColor: string; progressColor: string }> = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
      bg: "bg-white dark:bg-gray-900",
      border: "border-l-4 border-l-emerald-500 border border-emerald-100 dark:border-emerald-900",
      titleColor: "text-gray-900 dark:text-white",
      progressColor: "bg-emerald-500",
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />,
      bg: "bg-white dark:bg-gray-900",
      border: "border-l-4 border-l-red-500 border border-red-100 dark:border-red-900",
      titleColor: "text-gray-900 dark:text-white",
      progressColor: "bg-red-500",
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
      bg: "bg-white dark:bg-gray-900",
      border: "border-l-4 border-l-amber-500 border border-amber-100 dark:border-amber-900",
      titleColor: "text-gray-900 dark:text-white",
      progressColor: "bg-amber-500",
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />,
      bg: "bg-white dark:bg-gray-900",
      border: "border-l-4 border-l-blue-500 border border-blue-100 dark:border-blue-900",
      titleColor: "text-gray-900 dark:text-white",
      progressColor: "bg-blue-500",
    },
  };

  const c = config[t.type];

  return (
    <div
      role="alert"
      aria-live={t.type === "error" ? "assertive" : "polite"}
      className={`
        relative w-full max-w-sm rounded-xl shadow-xl overflow-hidden cursor-pointer
        ${c.bg} ${c.border}
        transition-all duration-300 ease-out
        ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}
      `}
      onClick={handleDismiss}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-gray-800">
          <div
            className={`h-full transition-none ${c.progressColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start gap-3 p-4 pt-5">
        {c.icon}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold leading-tight ${c.titleColor}`}>{t.title}</p>
          {t.message && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{t.message}</p>
          )}
          {t.action && (
            <button
              onClick={(e) => { e.stopPropagation(); t.action!.onClick(); handleDismiss(); }}
              className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {t.action.label} →
            </button>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Toast Container (renders fixed in top-right) ───────────────────────────────
export function ToastContainer() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
    >
      {ctx.toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem t={t} onDismiss={ctx.dismiss} />
        </div>
      ))}
    </div>
  );
}

// ── Provider ───────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  const toast = useCallback((opts: Omit<Toast, "id">): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => {
      // Max 4 toasts at once — remove oldest if exceeded
      const next = [...prev, { ...opts, id }];
      return next.length > 4 ? next.slice(next.length - 4) : next;
    });
    return id;
  }, []);

  const success = useCallback(
    (title: string, message?: string, action?: ToastAction) =>
      toast({ type: "success", title, message, action }),
    [toast]
  );
  const error = useCallback(
    (title: string, message?: string, action?: ToastAction) =>
      toast({ type: "error", title, message, action }),
    [toast]
  );
  const warning = useCallback(
    (title: string, message?: string, action?: ToastAction) =>
      toast({ type: "warning", title, message, action }),
    [toast]
  );
  const info = useCallback(
    (title: string, message?: string, action?: ToastAction) =>
      toast({ type: "info", title, message, action }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, dismiss, dismissAll }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback — log to console if used outside provider
    const noop = () => "";
    return {
      toasts: [] as Toast[],
      toast: noop,
      success: (title: string) => { console.log("✅", title); return ""; },
      error: (title: string) => { console.error("❌", title); return ""; },
      warning: (title: string) => { console.warn("⚠️", title); return ""; },
      info: (title: string) => { console.info("ℹ️", title); return ""; },
      dismiss: noop,
      dismissAll: noop,
    };
  }
  return ctx;
}
