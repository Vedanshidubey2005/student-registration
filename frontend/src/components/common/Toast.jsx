import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { subscribe } from "../../services/notifier";

export const ToastContext = createContext(null);

const ICONS = { success: "✓", error: "✕", warning: "!", info: "i" };
const MAX_VISIBLE = 4;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    ({ type = "info", message, duration = 5000 }) => {
      if (!message) return;
      const id = ++nextId.current;
      setToasts((list) => {
        if (list.some((t) => t.type === type && t.message === message)) return list; // no duplicates
        return [...list.slice(-(MAX_VISIBLE - 1)), { id, type, message }];
      });
      if (duration > 0) setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  // Toasts raised outside React (Axios interceptors)
  useEffect(() => subscribe(push), [push]);

  const api = useMemo(
    () => ({
      success: (message, options) => push({ type: "success", message, ...options }),
      error: (message, options) => push({ type: "error", message, ...options }),
      warning: (message, options) => push({ type: "warning", message, ...options }),
      info: (message, options) => push({ type: "info", message, ...options }),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`} role={toast.type === "error" ? "alert" : "status"}>
            <span className="toast__icon" aria-hidden="true">{ICONS[toast.type]}</span>
            <p className="toast__message">
              <span className="visually-hidden">{toast.type}: </span>
              {toast.message}
            </p>
            <button type="button" className="toast__close" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
