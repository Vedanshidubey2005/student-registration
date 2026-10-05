/**
 * Converts any Axios error into a safe, user-presentable ApiError.
 * Raw backend errors / stack traces are never passed through to the UI.
 *
 * ADAPT HERE: if the Spring Boot error envelope differs from
 *   { success:false, message:"...", errors:{ field:"..." } }
 * change safeBackendMessage() and extractFieldErrors() only.
 */
export const MESSAGES = {
  network: "Unable to connect to the server. Please check your internet connection.",
  timeout: "The request took too long. Please try again.",
  server: "Something went wrong. Please try again later.",
  forbidden: "You do not have permission to perform this action.",
  sessionExpired: "Your session has expired. Please sign in again.",
  tooMany: "Too many attempts. Please try again later.",
  generic: "We could not complete your request. Please check your input and try again.",
  fields: "Please correct the highlighted fields.",
};

export class ApiError extends Error {
  constructor({ message, status = null, fieldErrors = {}, isNetworkError = false }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.isNetworkError = isNetworkError;
    /** true once the interceptor has already shown a toast for this error */
    this.notified = false;
  }
}

function firstString(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.find((v) => typeof v === "string") ?? null;
  return null;
}

/** Accepts { errors: { email: "..." } } or { errors: [{ field, message }] } */
export function extractFieldErrors(data) {
  const raw = data?.errors;
  const result = {};
  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      if (item && typeof item.field === "string" && typeof item.message === "string") {
        result[item.field] = item.message;
      }
    });
  } else if (raw && typeof raw === "object") {
    Object.entries(raw).forEach(([field, value]) => {
      const message = firstString(value);
      if (message) result[field] = message;
    });
  }
  return result;
}

/** Only short plain-string messages from the backend are shown to users. */
function safeBackendMessage(data) {
  const message = typeof data?.message === "string" ? data.message.trim() : "";
  return message && message.length <= 200 ? message : null;
}

export function toApiError(error) {
  if (!error.response) {
    const timedOut = error.code === "ECONNABORTED";
    return new ApiError({
      message: timedOut ? MESSAGES.timeout : MESSAGES.network,
      isNetworkError: true,
    });
  }

  const { status, data } = error.response;
  const fieldErrors = extractFieldErrors(data);
  let message;

  if (status === 403) message = MESSAGES.forbidden;
  else if (status === 429) message = MESSAGES.tooMany;
  else if (status >= 500) message = MESSAGES.server;
  else {
    message =
      safeBackendMessage(data) ??
      (Object.keys(fieldErrors).length ? MESSAGES.fields : null) ??
      (status === 401 ? MESSAGES.sessionExpired : MESSAGES.generic);
  }

  return new ApiError({ message, status, fieldErrors });
}
