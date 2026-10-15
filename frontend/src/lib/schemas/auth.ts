import { z } from "zod";

const MIN_PASSWORD_LENGTH = 8;
const MIN_NAME_LENGTH = 2;
const EMAIL_MESSAGE = "Podaj poprawny adres e-mail.";
const PASSWORD_MESSAGE = `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`;

export const loginSchema = z.object({
  email: z.email(EMAIL_MESSAGE),
  password: z.string().min(1, "Podaj hasło."),
});

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(MIN_NAME_LENGTH, "Podaj imię i nazwisko."),
    email: z.email(EMAIL_MESSAGE),
    password: z.string().min(MIN_PASSWORD_LENGTH, PASSWORD_MESSAGE),
    password_confirm: z.string(),
  })
  .refine((values) => values.password === values.password_confirm, {
    message: "Hasła nie są takie same.",
    path: ["password_confirm"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
