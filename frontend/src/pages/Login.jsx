import { useContext, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import AuthLayout from "../components/auth/AuthLayout.jsx";
import Captcha from "../components/auth/Captcha.jsx";
import { notify } from "../services/notifier";

const initialValues = { email: "", password: "" };

/**
 * BACKEND INTEGRATION POINTS
 *  - Calls login() from AuthContext, which POSTs /auth/login (see authService.js).
 *    The backend sets an HttpOnly cookie; we never touch a token here.
 *  - On success, AuthContext's `user` state updates, so ProtectedRoute lets
 *    the app through to /dashboard without this page needing to navigate itself
 *    (navigation can still be added explicitly if your routing expects it).
 */
export default function Login() {
  const { login } = useContext(AuthContext);
  const captchaRef = useRef(null);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return; // guards against double submission
    if (!captchaRef.current?.verify()) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      notify.success("Signed in successfully.");
    } catch (err) {
      captchaRef.current?.refresh(); // challenges are single use
      const fieldEntries = Object.entries(err.fieldErrors || {});
      if (fieldEntries.length) {
        const nextErrors = {};
        fieldEntries.forEach(([field, message]) => {
          nextErrors[field] = message;
        });
        setErrors(nextErrors);
      }
      if (!err.notified) notify.error(err.message || "Incorrect email or password.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your account."
      footer={
        <>
          New here? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange("email")}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange("password")}
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <div className="field">
          <label>Enter the code shown below</label>
          <Captcha ref={captchaRef} />
          {errors.captcha && <span className="field-error">{errors.captcha}</span>}
        </div>

        <button type="submit" className="primary-btn" disabled={submitting}>
          {submitting ? "Signing in…" : "Log in"}
        </button>
      </form>
    </AuthLayout>
  );
}
