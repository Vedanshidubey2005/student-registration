import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthLayout from "../components/auth/AuthLayout";
import Captcha from "../components/auth/Captcha";
import PasswordFields from "../components/auth/PasswordFields";
import ProfilePhotoUpload from "../components/auth/ProfilePhotoUpload";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import { useToast } from "../hooks/useToast";
import { buildRegistrationFormData, registerUser } from "../services/authService";
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

// Backend field names mapping for server-side validation error handling
const FORM_FIELDS = ["fullName", "email", "mobileNumber", "mobileNo", "dateOfBirth", "dob", "gender", "password", "confirmPassword", "pincode", "profilePhoto", "photo"];

export default function Register() {
  const toast = useToast();
  const navigate = useNavigate();
  const captchaRef = useRef(null);
  const submittingRef = useRef(false);

  const methods = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues,
    mode: "onTouched",
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
    if (submittingRef.current) return;
    if (!captchaRef.current?.verify()) return;

    submittingRef.current = true;
    try {
      await registerUser(buildRegistrationFormData(values));
      captchaRef.current?.refresh();
      reset(defaultValues);
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      captchaRef.current?.refresh();
      const fieldEntries = Object.entries(err.fieldErrors || {}).filter(([field]) => FORM_FIELDS.includes(field));
      fieldEntries.forEach(([field, message], index) => {
        // Map backend field names back to form fields if needed
        const formFieldName = field === "mobileNo" ? "mobileNumber" : field === "dob" ? "dateOfBirth" : field === "photo" ? "profilePhoto" : field;
        setError(formFieldName, { type: "server", message }, { shouldFocus: index === 0 });
      });
      if (!err.notified) toast.error(err.message || "Registration failed");
    } finally {
      submittingRef.current = false;
    }
  };

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