import { FeedView } from "@/components/FeedView";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Tablica</h1>
      <FeedView />
    </main>
  );
}
