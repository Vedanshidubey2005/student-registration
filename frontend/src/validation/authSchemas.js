import { z } from "zod";

/* ---------- constants ---------- */
export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png"];
const ALLOWED_PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png"];

export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p) => /\d/.test(p) },
  { id: "special", label: "One special character", test: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { id: "spaces", label: "No spaces", test: (p) => p.length > 0 && !/\s/.test(p) },
];

/** Returns "Weak" | "Medium" | "Strong" (or null for an empty password). */
export function getPasswordStrength(password) {
  if (!password) return null;
  const passed = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
  if (passed <= 3) return "Weak";
  if (passed < PASSWORD_RULES.length || password.length < 12) return "Medium";
  return "Strong";
}

/* ---------- helpers ---------- */
export const digitsOnly = (value) => value.replace(/\D/g, "");

const pad = (n) => String(n).padStart(2, "0");
export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function parseISODate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(y, m - 1, d);
  const valid = date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  return valid ? date : null;
}

export const MIN_AGE = 18;
export const MAX_AGE = 120;

export function calculateAge(value) {
  const dob = parseISODate(value);
  if (!dob) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

/** min/max attributes for <input type="date"> */
export function getDateInputBounds() {
  const today = new Date();
  const oldest = new Date(today.getFullYear() - MAX_AGE, today.getMonth(), today.getDate());
  return { min: toISODate(oldest), max: toISODate(today) };
}

export function validateImageFile(file) {
  if (!file) return null;
  const name = (file.name || "").toLowerCase();
  const hasValidExtension = ALLOWED_PHOTO_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!ALLOWED_PHOTO_TYPES.includes(file.type) || !hasValidExtension) {
    return "Only JPG, JPEG or PNG images are allowed.";
  }
  if (file.size === 0) return "This file is empty. Please choose another image.";
  if (file.size > MAX_PHOTO_BYTES) return "The image is larger than 2 MB. Please choose a smaller file.";
  return null;
}

/* ---------- field schemas ---------- */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .max(150, "Email must be at most 150 characters")
  .email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .max(64, "Password must be at most 64 characters")
  .regex(/[A-Z]/, "Password needs at least one uppercase letter")
  .regex(/[a-z]/, "Password needs at least one lowercase letter")
  .regex(/\d/, "Password needs at least one number")
  .regex(/[^A-Za-z0-9\s]/, "Password needs at least one special character")
  .regex(/^\S*$/, "Password must not contain spaces");

function withPasswordMatch(shape, passwordKey, confirmKey, message) {
  return z.object(shape).superRefine((values, ctx) => {
    if (values[confirmKey] && values[passwordKey] !== values[confirmKey]) {
      ctx.addIssue({ code: "custom", path: [confirmKey], message });
    }
  });
}

/* ---------- form schemas ---------- */
export const registerSchema = withPasswordMatch(
  {
    fullName: z
      .string()
      .trim()
      .min(1, "Full name is required")
      .min(3, "Full name must be at least 3 characters")
      .max(100, "Full name must be at most 100 characters")
      .regex(/^[A-Za-z]+(?: [A-Za-z]+)*$/, "Use letters and single spaces only (no numbers or symbols)"),
    email: emailSchema,
    mobileNumber: z
      .string()
      .min(1, "Mobile number is required")
      .regex(/^\d+$/, "Mobile number must contain digits only")
      .length(10, "Mobile number must be exactly 10 digits")
      .regex(/^[6-9]/, "Enter a valid Indian mobile number (starts with 6, 7, 8 or 9)"),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .superRefine((value, ctx) => {
        const dob = parseISODate(value);
        if (!dob) return ctx.addIssue({ code: "custom", message: "Enter a valid date of birth" });
        if (dob > new Date()) return ctx.addIssue({ code: "custom", message: "Date of birth cannot be in the future" });
        const age = calculateAge(value);
        if (age < MIN_AGE) ctx.addIssue({ code: "custom", message: `You must be at least ${MIN_AGE} years old` });
        else if (age > MAX_AGE) ctx.addIssue({ code: "custom", message: "Enter a valid date of birth" });
      }),
    gender: z.enum(GENDER_OPTIONS.map((o) => o.value), {
      errorMap: () => ({ message: "Select a gender option" }),
    }),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
    pincode: z
      .string()
      .min(1, "Pincode is required")
      .regex(/^\d+$/, "Pincode must contain digits only")
      .regex(/^[1-9]\d{5}$/, "Pincode must be exactly 6 digits and cannot start with 0"),
    profilePhoto: z.any().superRefine((file, ctx) => {
      const message = validateImageFile(file);
      if (message) ctx.addIssue({ code: "custom", message });
    }),
  },
  "password",
  "confirmPassword",
  "Passwords do not match"
);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = withPasswordMatch(
  {
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Confirm your new password"),
  },
  "newPassword",
  "confirmNewPassword",
  "Passwords do not match"
);
