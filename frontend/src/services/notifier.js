/**
 * Tiny event bus so non-React code (the Axios interceptors) can raise toasts.
 * <ToastProvider /> subscribes to it. Components should prefer the useToast() hook.
 */
const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const emit = (type, message, options = {}) =>
  listeners.forEach((listener) => listener({ type, message, ...options }));

export const notify = {
  success: (message, options) => emit("success", message, options),
  error: (message, options) => emit("error", message, options),
  warning: (message, options) => emit("warning", message, options),
  info: (message, options) => emit("info", message, options),
};
