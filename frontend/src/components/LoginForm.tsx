"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Field, INPUT_CLASS } from "@/components/Field";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth/useSession";
import { loginSchema, type LoginValues } from "@/lib/schemas/auth";

export function LoginForm() {
  const router = useRouter();
  const { signIn } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const login = useMutation({
    mutationFn: (values: LoginValues) => api.login(values),
    onSuccess: async (session) => {
      await signIn(session.access_token);
      router.push("/");
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => login.mutate(values))}
      noValidate
      className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm"
    >
      <Field label="E-mail" error={errors.email?.message}>
        <input type="email" autoComplete="email" className={INPUT_CLASS} {...register("email")} />
      </Field>
      <Field label="Hasło" error={errors.password?.message}>
        <input
          type="password"
          autoComplete="current-password"
          className={INPUT_CLASS}
          {...register("password")}
        />
      </Field>
      {login.isError && (
        <p role="alert" className="text-sm text-accent-600">
          {login.error.message}
        </p>
      )}
      <button
        type="submit"
        disabled={login.isPending}
        className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {login.isPending ? "Logowanie…" : "Zaloguj się"}
      </button>
    </form>
  );
}
