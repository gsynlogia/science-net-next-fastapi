import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Rejestracja — Science Net",
};

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Załóż konto</h1>
      <RegisterForm />
      <p className="mt-4 text-sm text-slate-600">
        Masz już konto?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Zaloguj się
        </Link>
      </p>
    </main>
  );
}
