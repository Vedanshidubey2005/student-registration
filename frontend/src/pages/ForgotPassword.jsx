import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthLayout from "../components/auth/AuthLayout";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import { useToast } from "../hooks/useToast";
import { forgotPassword } from "../services/authService";
import { forgotPasswordSchema } from "../validation/authSchemas";

const GENERIC_MESSAGE = "If an account exists with this email, a password reset link has been sent.";

export default function ForgotPassword() {
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" }, mode: "onTouched" });

  const onSubmit = async ({ email }) => {
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success(GENERIC_MESSAGE);
    } catch (err) {
      // Never reveal whether the account exists: treat "not found" like success.
      if (err.status === 404) {
        setSent(true);
        toast.success(GENERIC_MESSAGE);
      } else if (!err.notified) {
        toast.error(err.message);
      }
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={<Link to="/login">Back to Login</Link>}
    >
      {sent ? (
        <div className="notice" role="status">
          <p>{GENERIC_MESSAGE}</p>
          <Button
            variant="link"
            onClick={() => {
              reset();
              setSent(false);
            }}
          >
            Use a different email
          </Button>
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting}>
          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            maxLength={150}
            error={errors.email?.message}
            {...register("email")}
          />
          <Button type="submit" fullWidth loading={isSubmitting} loadingText="Sending Reset Link...">
            Send Reset Link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
