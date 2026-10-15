"use client";

interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main role="alert" className="mx-auto max-w-2xl p-6 text-center">
      <h1 className="text-2xl font-bold text-accent-600">Coś poszło nie tak</h1>
      <p className="mt-2 text-slate-600">
        Nie udało się wczytać strony. Spróbuj ponownie za chwilę.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
      >
        Spróbuj ponownie
      </button>
    </main>
  );
}
