import { useContext, useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import AuthLayout from "../components/auth/AuthLayout.jsx";
import Captcha from "../components/auth/Captcha.jsx";
import { notify } from "../services/notifier";

const initialValues = { email: "", password: "" };

export default function Login() {
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const captchaRef = useRef(null);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  // Agar context me user login detect ho gaya ho toh auto-redirect kare
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!captchaRef.current?.verify()) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      notify.success("Signed in successfully.");

      // Direct route navigation
      navigate("/dashboard", { replace: true });
    } catch (err) {
      captchaRef.current?.refresh();
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