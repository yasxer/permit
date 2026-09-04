import { z } from "zod";

/**
 * Schemas are built from a translator so error messages land in the user's
 * language. Call the factory inside the component that owns the form.
 */
export type Translator = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

/** Strong password: 8+ chars, one uppercase, one digit, one special character. */
export function passwordSchema(t: Translator) {
  return z
    .string()
    .min(8, { message: t("passwordMin") })
    .regex(/[A-Z]/, { message: t("passwordUppercase") })
    .regex(/[0-9]/, { message: t("passwordNumber") })
    .regex(/[^A-Za-z0-9]/, { message: t("passwordSpecial") });
}

export function loginSchema(t: Translator) {
  return z.object({
    email: z.email({ message: t("email") }),
    // Deliberately not the strong-password schema: an existing account may
    // predate the rule, and echoing the policy back on sign-in leaks it.
    password: z.string().min(1, { message: t("required") }),
  });
}

export function registerSchema(t: Translator) {
  return z
    .object({
      schoolName: z.string().trim().min(2, { message: t("min", { count: 2 }) }),
      email: z.email({ message: t("email") }),
      password: passwordSchema(t),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: t("passwordMismatch"),
    });
}

export function forgotPasswordSchema(t: Translator) {
  return z.object({
    email: z.email({ message: t("email") }),
  });
}

export function resetPasswordSchema(t: Translator) {
  return z
    .object({
      password: passwordSchema(t),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: t("passwordMismatch"),
    });
}

export type LoginValues = z.infer<ReturnType<typeof loginSchema>>;
export type RegisterValues = z.infer<ReturnType<typeof registerSchema>>;
export type ForgotPasswordValues = z.infer<ReturnType<typeof forgotPasswordSchema>>;
export type ResetPasswordValues = z.infer<ReturnType<typeof resetPasswordSchema>>;
