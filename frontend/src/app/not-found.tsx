import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl p-6 text-center">
      <h1 className="text-2xl font-bold text-brand-700">Nie znaleziono strony</h1>
      <p className="mt-2 text-slate-600">Ten adres nie istnieje albo treść została usunięta.</p>
      <Link href="/" className="mt-4 inline-block font-medium text-brand-600 hover:underline">
        Wróć na tablicę
      </Link>
    </main>
  );
}
