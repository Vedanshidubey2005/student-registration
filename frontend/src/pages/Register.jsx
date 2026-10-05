import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthLayout from "../components/auth/AuthLayout";
import Captcha from "../components/auth/Captcha";
import PasswordFields from "../components/auth/PasswordFields";
import ProfilePhotoUpload from "../components/auth/ProfilePhotoUpload";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import { useToast } from "../hooks/useToast";
import { buildRegistrationFormData, registerUser, resendVerificationEmail } from "../services/authService";
import {
  GENDER_OPTIONS,
  calculateAge,
  digitsOnly,
  getDateInputBounds,
  registerSchema,
  MIN_AGE,
  MAX_AGE,
} from "../validation/authSchemas";

const defaultValues = {
  fullName: "",
  email: "",
  mobileNumber: "",
  dateOfBirth: "",
  gender: "",
  password: "",
  confirmPassword: "",
  pincode: "",
  profilePhoto: null,
};

// Backend field names we know how to show inline
const FORM_FIELDS = ["fullName", "email", "mobileNumber", "dateOfBirth", "gender", "password", "pincode", "profilePhoto"];
const RESEND_COOLDOWN_SECONDS = 30;

function VerificationNotice({ email }) {
  const toast = useToast();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (resending || cooldown > 0) return;
    setResending(true);
    try {
      await resendVerificationEmail(email);
      toast.success("Verification email sent. Please check your inbox.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      if (!err.notified) toast.error(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Registration successful!"
      footer={<Link to="/login">Go to Login</Link>}
    >
      <div className="notice" role="status">
        <p>We've sent a verification link to your email address.</p>
        <p><strong>{email}</strong></p>
        <p>Please verify your email before logging in.</p>
      </div>
      <p className="notice__resend-text">Didn't receive the email?</p>
      <Button variant="secondary" onClick={handleResend} loading={resending} loadingText="Sending..." disabled={cooldown > 0}>
        {cooldown > 0 ? `Resend verification email (${cooldown}s)` : "Resend verification email"}
      </Button>
    </AuthLayout>
  );
}

export default function Register() {
  const toast = useToast();
  const captchaRef = useRef(null);
  const submittingRef = useRef(false);
  const [registeredEmail, setRegisteredEmail] = useState(null);

  const methods = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues,
    mode: "onTouched", // validate on blur first, then on every change
    reValidateMode: "onChange",
  });
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = methods;

  const age = calculateAge(watch("dateOfBirth"));
  const dateBounds = getDateInputBounds();

  const onInvalid = () => toast.warning("Please correct the highlighted fields.");

  const onSubmit = async (values) => {
    if (submittingRef.current) return; // guards against double submission
    if (!captchaRef.current?.verify()) return;

    submittingRef.current = true;
    try {
      await registerUser(buildRegistrationFormData(values));
      captchaRef.current?.refresh();
      reset(defaultValues);
      setRegisteredEmail(values.email);
      toast.success("Registration successful. Please verify your email.");
    } catch (err) {
      captchaRef.current?.refresh(); // challenges are single use
      const fieldEntries = Object.entries(err.fieldErrors || {}).filter(([field]) => FORM_FIELDS.includes(field));
      fieldEntries.forEach(([field, message], index) => {
        setError(field, { type: "server", message }, { shouldFocus: index === 0 });
      });
      if (!err.notified) toast.error(err.message);
    } finally {
      submittingRef.current = false;
    }
  };

  if (registeredEmail) return <VerificationNotice email={registeredEmail} />;

  return (
    <AuthLayout
      wide
      title="Create your account"
      subtitle="Fields marked * are required."
      footer={<>Already have an account? <Link to="/login">Login</Link></>}
    >
      <FormProvider {...methods}>
        <form className="form" onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate aria-busy={isSubmitting}>
          <div className="form-grid">
            <Input
              className="form-grid__item"
              label="Full name"
              required
              autoComplete="name"
              maxLength={100}
              placeholder="John Doe"
              error={errors.fullName?.message}
              {...register("fullName")}
            />
            <Input
              className="form-grid__item"
              label="Email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              maxLength={150}
              placeholder="john.doe@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <Controller
              name="mobileNumber"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  className="form-grid__item"
                  label="Mobile number"
                  required
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  placeholder="9876543210"
                  hint="10-digit Indian mobile number, without country code"
                  error={fieldState.error?.message}
                  {...field}
                  onChange={(e) => field.onChange(digitsOnly(e.target.value))}
                />
              )}
            />

            <Input
              className="form-grid__item"
              label="Date of birth"
              type="date"
              required
              autoComplete="bday"
              min={dateBounds.min}
              max={dateBounds.max}
              hint={age !== null && age >= 0 && age <= MAX_AGE ? `Age: ${age} years` : `You must be at least ${MIN_AGE} years old`}
              error={errors.dateOfBirth?.message}
              {...register("dateOfBirth")}
            />

            <fieldset className="form-grid__item fieldset" aria-describedby={errors.gender ? "gender-error" : undefined}>
              <legend className="field__label">
                Gender <span className="field__required" aria-hidden="true">*</span>
              </legend>
              <div className="radio-group">
                {GENDER_OPTIONS.map((option) => (
                  <label key={option.value} className="radio">
                    <input type="radio" value={option.value} {...register("gender")} />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.gender && (
                <p id="gender-error" className="field__error" role="alert">
                  <span aria-hidden="true">⚠ </span>
                  {errors.gender.message}
                </p>
              )}
            </fieldset>

            <Controller
              name="pincode"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  className="form-grid__item form-grid__item--pincode"
                  label="Pincode"
                  required
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  placeholder="462001"
                  error={fieldState.error?.message}
                  {...field}
                  onChange={(e) => field.onChange(digitsOnly(e.target.value))}
                />
              )}
            />

            <PasswordFields />

            <Controller
              name="profilePhoto"
              control={control}
              render={({ field, fieldState }) => (
                <ProfilePhotoUpload
                  className="form-grid__item form-grid__item--after"
                  ref={field.ref}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  disabled={isSubmitting}
                />
              )}
            />

            <Captcha ref={captchaRef} className="form-grid__item form-grid__item--after" disabled={isSubmitting} />
          </div>

          <div className="form-actions">
            <Button type="submit" loading={isSubmitting} loadingText="Creating Account...">
              Create Account
            </Button>
          </div>
        </form>
      </FormProvider>
    </AuthLayout>
  );
}
