"use client";

/** Toast notification system — provides context-based toast with success/error/warning/info types, auto-dismiss after 4s. */
import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

/** Supported toast variants — controls icon and border color. */
export type ToastType = "success" | "error" | "warning" | "info";

/** A single toast notification — unique ID, type variant, and message text. */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

/** Context value — current toasts, add function, and remove function. */
interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Hook to access toast context. Throws if used outside ToastProvider.
 * @returns {{ toasts: Toast[], addToast: (type: ToastType, message: string) => void, removeToast: (id: string) => void }}
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

/**
 * Provider component that wraps the app and manages toast state.
 * Auto-removes toasts after 4 seconds. Renders ToastContainer for display.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
      <style>{`
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 360px;
        }
      `}</style>
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const icons = {
    success: <CheckCircle size={18} />,
    error: <AlertCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
  };

  const colors = {
    success: "var(--toast-success, #10b981)",
    error: "var(--toast-error, #ef4444)",
    warning: "var(--toast-warning, #f59e0b)",
    info: "var(--toast-info, #3b82f6)",
  };

  return (
    <div
      className="toast-item"
      style={{
        background: "var(--card, #1e1f2e)",
        border: `1px solid ${colors[toast.type]}`,
        borderLeft: `4px solid ${colors[toast.type]}`,
        borderRadius: "8px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        animation: "slideIn 0.2s ease-out",
      }}
    >
      <span style={{ color: colors[toast.type] }}>{icons[toast.type]}</span>
      <span
        style={{
          flex: 1,
          color: "var(--text, #e8e9ed)",
          fontSize: "14px",
          lineHeight: "1.4",
        }}
      >
        {toast.message}
      </span>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text, #e8e9ed)",
          opacity: 0.6,
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="Cerrar"
      >
        <X size={16} />
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .toast-item:hover {
          opacity: 0.95;
        }
      `}</style>
    </div>
  );
}
