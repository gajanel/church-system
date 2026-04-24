import { createContext, useContext, useState, useCallback, useRef } from "react";
import styles from "./Toast.module.css";

// ── Context ────────────────────────────────────────────────────────
const ToastContext = createContext(null);

const ICONS = {
  success: "✅",
  error:   "❌",
  warning: "⚠️",
  info:    "ℹ️",
};

let _id = 0;

// ── Provider ───────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remove = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 220);
  }, []);

  const toast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);
    timers.current[id] = setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);

  // Shortcuts
  toast.success = (msg, d) => toast(msg, "success", d);
  toast.error   = (msg, d) => toast(msg, "error", d);
  toast.warning = (msg, d) => toast(msg, "warning", d);
  toast.info    = (msg, d) => toast(msg, "info", d);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={styles.container}>
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.type]} ${t.exiting ? styles.exiting : ""}`}
            onClick={() => remove(t.id)}
          >
            <span className={styles.icon}>{ICONS[t.type]}</span>
            <span className={styles.message}>{t.message}</span>
            <button className={styles.close} onClick={e => { e.stopPropagation(); remove(t.id); }}>✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
