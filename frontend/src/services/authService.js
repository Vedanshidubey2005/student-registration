import apiClient from "./apiClient";

/**
 * All calls to the future Spring Boot auth endpoints live here.
 * Components must never call Axios directly.
 *
 * AUTH MODEL: the backend is expected to set an HttpOnly + Secure + SameSite cookie
 * (JWT or session id) on login. The browser stores and sends it; JavaScript never
 * sees it, so nothing sensitive is kept in localStorage/sessionStorage.
 * If the login response also contains a "token" field, it is intentionally ignored.
 */

/** Maps the login/me response to the shape the app uses. Adapt here if the API differs. */
function adaptUser(data) {
  const user = data?.user ?? data?.data?.user ?? null;
  return user && typeof user === "object" ? user : null;
}

/** Builds the multipart payload for registration. confirmPassword and CAPTCHA are NOT sent. */
export function buildRegistrationFormData(values) {
  const formData = new FormData();
  formData.append("fullName", values.fullName);
  formData.append("email", values.email);
  formData.append("mobileNumber", values.mobileNumber);
  formData.append("dateOfBirth", values.dateOfBirth); // yyyy-mm-dd
  formData.append("gender", values.gender);
  formData.append("password", values.password);
  formData.append("pincode", values.pincode);
  if (values.profilePhoto) formData.append("profilePhoto", values.profilePhoto);
  // CAPTCHA: when a real provider is added, send its token as a header or a dedicated
  // field (e.g. "captchaToken") and verify it server-side. Never send the typed demo answer.
  return formData;
}

/** POST /api/auth/register (multipart/form-data) */
export async function registerUser(formData) {
  const { data } = await apiClient.post("/auth/register", formData, { skipAuthRedirect: true });
  return data;
}

/** POST /api/auth/login  payload: { email, password, rememberMe } */
export async function loginUser(payload) {
  const { data } = await apiClient.post("/auth/login", payload, { skipAuthRedirect: true });
  return { user: adaptUser(data), message: data?.message ?? "", raw: data };
}

/** POST /api/auth/logout - the backend clears the auth cookie. */
export async function logoutUser() {
  await apiClient.post("/auth/logout", null, { skipAuthRedirect: true, silent: true });
}

/** GET /api/auth/me - restores the session on page load (cookie-based). */
export async function getCurrentUser() {
  const { data } = await apiClient.get("/auth/me", { skipAuthRedirect: true, silent: true });
  return adaptUser(data) ?? (data && data.id ? data : null);
}

/** POST /api/auth/forgot-password  payload: { email } */
export async function forgotPassword(email) {
  const { data } = await apiClient.post("/auth/forgot-password", { email }, { skipAuthRedirect: true });
  return data;
}

/** POST /api/auth/reset-password  payload: { token, newPassword } */
export async function resetPassword({ token, newPassword }) {
  const { data } = await apiClient.post(
    "/auth/reset-password",
    { token, newPassword },
    { skipAuthRedirect: true }
  );
  return data;
}

/** POST /api/auth/resend-verification  payload: { email } */
export async function resendVerificationEmail(email) {
  const { data } = await apiClient.post("/auth/resend-verification", { email }, { skipAuthRedirect: true });
  return data;
}
