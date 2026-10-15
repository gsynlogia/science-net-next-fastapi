import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Logowanie — Science Net",
};

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Logowanie</h1>
      <LoginForm />
    </main>
  );
}
