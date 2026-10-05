# Auth Frontend (React)

Frontend-only authentication module, ready to connect to a Spring Boot + MySQL backend.
No backend, database or mock server is included.

## Run

```bash
npm install
cp .env.example .env     # a .env is already included; edit the URL if needed
npm run dev              # http://localhost:5173
npm run build            # production build
```

Dependencies: react, react-dom, react-router-dom, axios, react-hook-form, zod, @hookform/resolvers.

## Routes

| Path | Access |
|---|---|
| `/login`, `/register` | signed-out only (signed-in users go to `/dashboard`) |
| `/forgot-password`, `/reset-password?token=...` | public |
| `/dashboard` | signed-in only (else redirect to `/login`) |
| `/404`, any unknown path | not found |

## Connecting the Spring Boot backend

Endpoints expected under `VITE_API_BASE_URL` (default `http://localhost:8080/api`):

```
POST /auth/register            multipart/form-data: fullName, email, mobileNumber,
                               dateOfBirth (yyyy-mm-dd), gender, password, pincode, profilePhoto
POST /auth/login               { email, password, rememberMe }
POST /auth/logout
GET  /auth/me                  returns { user } (or the user object) when the cookie is valid
POST /auth/forgot-password     { email }
POST /auth/reset-password      { token, newPassword }
POST /auth/resend-verification { email }
```

- **Session:** the app relies on an HttpOnly + Secure + SameSite cookie. Axios uses `withCredentials: true`; Spring must enable CORS for the frontend origin with `allowCredentials(true)`. No token is stored in localStorage.
- **CSRF:** Axios echoes the `XSRF-TOKEN` cookie in `X-XSRF-TOKEN` (Spring `CookieCsrfTokenRepository`).
- **Gender values** sent: `MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY`.
- **Errors:** `{ "message": "..." }` and `{ "errors": { "email": "..." } }` are mapped to toasts and form fields. Adapt `src/services/apiError.js` if the envelope differs. Login/`me` response parsing lives in `src/services/authService.js`.
- **CAPTCHA:** `src/components/auth/Captcha.jsx` is a demo and gives no real protection. Replace it with reCAPTCHA / Turnstile / hCaptcha and verify the token on the server (see the comment at the top of the file).
- **Profile photo** is optional in this UI. Make it required in `authSchemas.js` if your backend needs it.
- All frontend validation is a convenience; the backend must re-validate everything.

## Structure

```
src/
  components/common   Button, Input, PasswordInput, Loader, Toast
  components/auth     AuthLayout, Captcha, PasswordFields, PasswordStrength, ProfilePhotoUpload
  pages               Login, Register, ForgotPassword, ResetPassword, Dashboard, NotFound
  context/hooks       AuthContext, useAuth, useToast
  services            apiClient (Axios + interceptors), apiError, authService, notifier
  validation          authSchemas (Zod)
  routes              ProtectedRoute (+ PublicOnlyRoute)
  styles              global, components, form, auth, dashboard
```
