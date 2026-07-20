import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_REQUIREMENTS = `Use at least ${PASSWORD_MIN_LENGTH} characters with at least one uppercase letter, one number, and one special character.`;

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .transform((email) => email.toLowerCase());

const passwordSchema = z.string().superRefine((password, context) => {
  if (!password.trim()) {
    context.addIssue({
      code: "custom",
      message: "Password is required",
    });
    return;
  }

  const meetsSecurityRules =
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9\s]/.test(password);

  if (!meetsSecurityRules) {
    context.addIssue({
      code: "custom",
      message: PASSWORD_REQUIREMENTS,
    });
  }
});

export const signUpSchema = z
  .object({
    businessName: requiredText("Business name"),
    firstName: requiredText("First name"),
    lastName: requiredText("Last name"),
    email: emailSchema,
    dialCode: requiredText("Dial code"),
    phone: requiredText("Phone number"),
    password: passwordSchema,
    confirmPassword: z
      .string()
      .refine(
        (password) => Boolean(password.trim()),
        "Please confirm your password",
      ),
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  })
  .transform(({ confirmPassword: _confirmPassword, ...input }) => input);

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .refine((password) => Boolean(password.trim()), "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .refine(
        (password) => Boolean(password.trim()),
        "Current password is required",
      ),
    newPassword: passwordSchema,
    confirmPassword: z
      .string()
      .refine(
        (password) => Boolean(password.trim()),
        "Please confirm your new password",
      ),
  })
  .superRefine((values, context) => {
    if (values.newPassword !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  })
  .transform(({ confirmPassword: _confirmPassword, ...input }) => input);

export type SignUpFormValues = z.input<typeof signUpSchema>;
export type SignUpField = keyof SignUpFormValues;
export type ChangePasswordFormValues = z.input<typeof changePasswordSchema>;
export type ChangePasswordField = keyof ChangePasswordFormValues;

export function getSchemaFieldErrors<TField extends string>(error: z.ZodError) {
  const fields: Partial<Record<TField, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fields[field as TField]) {
      fields[field as TField] = issue.message;
    }
  }

  return fields;
}

export function summarizeFieldErrors<TField extends string>(
  fields: Partial<Record<TField, string>>,
) {
  return [
    ...new Set(Object.values(fields).filter((message) => Boolean(message))),
  ].join(" ");
}
