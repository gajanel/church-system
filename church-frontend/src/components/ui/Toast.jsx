/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  CheckCircleOutline,
  Close,
  ErrorOutline,
  InfoOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import styles from "./Toast.module.css";

// ── Context ────────────────────────────────────────────────────────
const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircleOutline />,
  error: <ErrorOutline />,
  warning: <WarningAmberOutlined />,
  info: <InfoOutlined />,
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
            <button className={styles.close} aria-label="Cerrar notificación" onClick={e => { e.stopPropagation(); remove(t.id); }}><Close /></button>
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
