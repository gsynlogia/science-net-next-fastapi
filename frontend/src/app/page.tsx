import { FeedView } from "@/components/FeedView";
import { MOCK_ARTICLES } from "@/lib/mock/data";

export default function HomePage() {
  const newestFirst = [...MOCK_ARTICLES].sort((a, b) => b.id - a.id);
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Tablica</h1>
      <FeedView articles={newestFirst} />
    </main>
  );
}
