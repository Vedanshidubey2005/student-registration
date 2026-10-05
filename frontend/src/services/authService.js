import apiClient from "./apiClient";

/** Maps the login/me response to the shape the app uses. Adapt here if the API differs. */
function adaptUser(data) {
  const user = data?.user ?? data?.data?.user ?? null;
  return user && typeof user === "object" ? user : null;
}

/** Builds the multipart payload for registration matched to RegistrationRequestDTO. */
export function buildRegistrationFormData(values) {
  const formData = new FormData();
  formData.append("fullName", values.fullName);
  formData.append("email", values.email);
  formData.append("mobileNo", values.mobileNumber); // Mapped to DTO's mobileNo
  formData.append("dob", values.dateOfBirth);       // Mapped to DTO's dob (yyyy-MM-dd)
  formData.append("gender", values.gender);
  formData.append("password", values.password);
  formData.append("confirmPassword", values.confirmPassword); // Mapped to DTO's confirmPassword
  formData.append("pincode", values.pincode);
  
  if (values.profilePhoto) {
    formData.append("photo", values.profilePhoto);  // Mapped to DTO's photo (MultipartFile)
  }

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
export async function logoutUser(email) {
  // Java controller: @PostMapping("/logout") public ResponseEntity logoutUser(@RequestParam String email)
  await apiClient.post(`/auth/logout?email=${encodeURIComponent(email || "")}`, null, { skipAuthRedirect: true, silent: true });
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