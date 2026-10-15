import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "O portalu — Science Net",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold text-brand-600">O portalu</h1>
      <p className="mt-3 text-slate-700">
        Science Net to portal społecznościowy dla ludzi nauki. Zamiast zdjęć z wakacji publikujesz
        tu artykuły naukowe, obserwujesz badaczy, komentujesz i polecasz prace, które okazały się
        przydatne.
      </p>
    </main>
  );
}
