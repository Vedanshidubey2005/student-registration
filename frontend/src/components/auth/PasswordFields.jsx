import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import PasswordInput from "../common/PasswordInput";
import PasswordStrength from "./PasswordStrength";

/**
 * Password + confirm password + strength meter. Shared by Register and Reset Password.
 * Renders a fragment so the parent grid controls the layout. Needs <FormProvider>.
 */
export default function PasswordFields({
  passwordName = "password",
  confirmName = "confirmPassword",
  passwordLabel = "Password",
  confirmLabel = "Confirm password",
  autoComplete = "new-password",
}) {
  const { register, watch, trigger, getValues, formState: { errors } } = useFormContext();
  const password = watch(passwordName) ?? "";
  const confirm = watch(confirmName) ?? "";
  const matches = confirm.length > 0 && password === confirm;

  // Re-check "must match" immediately whenever the password changes.
  useEffect(() => {
    if (getValues(confirmName)) trigger(confirmName);
  }, [password, confirmName, getValues, trigger]);

  return (
    <>
      <PasswordInput
        className="form-grid__item"
        label={passwordLabel}
        required
        autoComplete={autoComplete}
        maxLength={64}
        error={errors[passwordName]?.message}
        {...register(passwordName)}
      />
      <PasswordInput
        className="form-grid__item"
        label={confirmLabel}
        required
        autoComplete={autoComplete}
        maxLength={64}
        error={errors[confirmName]?.message}
        hint={matches ? <span className="text-success">Passwords match ✓</span> : undefined}
        {...register(confirmName)}
      />
      <div className="form-grid__full form-grid__item--rules">
        <PasswordStrength password={password} />
      </div>
    </>
  );
}
