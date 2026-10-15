import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Podaj poprawny adres e-mail."),
  password: z.string().min(1, "Podaj hasło."),
});

export type LoginValues = z.infer<typeof loginSchema>;
