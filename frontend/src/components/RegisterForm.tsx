"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Field, INPUT_CLASS } from "@/components/Field";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth/useSession";
import { registerSchema, type RegisterValues } from "@/lib/schemas/auth";

export function RegisterForm() {
  const router = useRouter();
  const { signIn } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });
  const registration = useMutation({
    mutationFn: (values: RegisterValues) =>
      api.register({ full_name: values.full_name, email: values.email, password: values.password }),
    onSuccess: async (session) => {
      await signIn(session.access_token);
      router.push("/");
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => registration.mutate(values))}
      noValidate
      className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm"
    >
      <Field label="Imię i nazwisko" error={errors.full_name?.message}>
        <input type="text" autoComplete="name" className={INPUT_CLASS} {...register("full_name")} />
      </Field>
      <Field label="E-mail" error={errors.email?.message}>
        <input type="email" autoComplete="email" className={INPUT_CLASS} {...register("email")} />
      </Field>
      <Field label="Hasło" error={errors.password?.message}>
        <input
          type="password"
          autoComplete="new-password"
          className={INPUT_CLASS}
          {...register("password")}
        />
      </Field>
      <Field label="Powtórz hasło" error={errors.password_confirm?.message}>
        <input
          type="password"
          autoComplete="new-password"
          className={INPUT_CLASS}
          {...register("password_confirm")}
        />
      </Field>
      {registration.isError && (
        <p role="alert" className="text-sm text-accent-600">
          {registration.error.message}
        </p>
      )}
      <button
        type="submit"
        disabled={registration.isPending}
        className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {registration.isPending ? "Zakładanie konta…" : "Załóż konto"}
      </button>
    </form>
  );
}
