import { FeedView } from "@/components/FeedView";
import { MOCK_ARTICLES } from "@/lib/mock/data";

export default function HomePage() {
  const newestFirst = [...MOCK_ARTICLES].sort((a, b) => b.id - a.id);
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold text-brand-600">Science Net</h1>
      <p className="mt-2 mb-6 text-slate-600">Portal społecznościowy dla ludzi nauki.</p>
      <FeedView articles={newestFirst} />
    </main>
  );
}
