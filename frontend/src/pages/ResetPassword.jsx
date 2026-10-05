import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthLayout from "../components/auth/AuthLayout";
import PasswordFields from "../components/auth/PasswordFields";
import Button from "../components/common/Button";
import { useToast } from "../hooks/useToast";
import { resetPassword } from "../services/authService";
import { resetPasswordSchema } from "../validation/authSchemas";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // used only in the request payload; never rendered
  const navigate = useNavigate();
  const toast = useToast();

  const methods = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmNewPassword: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const {
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = async ({ newPassword }) => {
    try {
      await resetPassword({ token, newPassword });
      toast.success("Password reset successfully. Please login with your new password.");
      navigate("/login", { replace: true });
    } catch (err) {
      if (err.fieldErrors?.newPassword) {
        setError("newPassword", { type: "server", message: err.fieldErrors.newPassword }, { shouldFocus: true });
      }
      if (!err.notified) toast.error(err.message);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Reset link not valid" footer={<Link to="/login">Back to Login</Link>}>
        <div className="notice" role="alert">
          <p>This password reset link is missing or incomplete. Request a new one to continue.</p>
          <Link to="/forgot-password" className="btn btn--primary">Request a new link</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a strong password you haven't used before."
      footer={<Link to="/login">Back to Login</Link>}
    >
      <FormProvider {...methods}>
        <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting}>
          <div className="form-grid form-grid--single">
            <PasswordFields
              passwordName="newPassword"
              confirmName="confirmNewPassword"
              passwordLabel="New password"
              confirmLabel="Confirm new password"
            />
          </div>
          <Button type="submit" fullWidth loading={isSubmitting} loadingText="Resetting Password...">
            Reset Password
          </Button>
        </form>
      </FormProvider>
    </AuthLayout>
  );
}
