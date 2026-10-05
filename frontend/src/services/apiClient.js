import axios from "axios";
import { toApiError, MESSAGES } from "./apiError";
import { notify } from "./notifier";

/**
 * Central Axios instance. The backend URL comes from .env (VITE_API_BASE_URL);
 * it is never hardcoded anywhere else.
 *
 * Per-request flags (pass in the Axios config):
 *   skipAuthRedirect - a 401 is a normal answer (e.g. wrong password); not a session expiry
 *   silent           - never show a global toast for this request (used for session restore)
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  // Required so the browser sends/accepts the HttpOnly session/JWT cookie set by Spring Boot.
  // The backend must allow the frontend origin in CORS with allowCredentials(true).
  withCredentials: true,
  // Spring Security's CookieCsrfTokenRepository: echo the XSRF-TOKEN cookie in this header.
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  withXSRFToken: true,
});

let unauthorizedHandler = null;
/** AuthContext registers a callback here to clear its state when the session expires. */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

apiClient.interceptors.request.use((config) => {
  // Let the browser set multipart/form-data with the correct boundary.
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  // BACKEND INTEGRATION: if you ever must fall back to a Bearer token (not recommended),
  // attach it here. With HttpOnly cookies nothing is needed - the browser sends them.
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    const apiError = toApiError(error);
    const { silent, skipAuthRedirect } = error.config || {};

    if (!silent) {
      if (apiError.isNetworkError) {
        notify.error(apiError.message);
        apiError.notified = true;
      } else if (apiError.status === 401 && !skipAuthRedirect) {
        // Session expired: clear auth state. ProtectedRoute then redirects to /login.
        unauthorizedHandler?.();
        notify.warning(MESSAGES.sessionExpired);
        apiError.notified = true;
      } else if (apiError.status === 403 || apiError.status >= 500) {
        notify.error(apiError.message);
        apiError.notified = true;
      }
    }
    return Promise.reject(apiError);
  }
);

export default apiClient;
