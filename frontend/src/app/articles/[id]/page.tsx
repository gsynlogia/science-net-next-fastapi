import { notFound } from "next/navigation";
import { ArticleDetail } from "@/components/ArticleDetail";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const articleId = Number(id);
  if (!Number.isInteger(articleId) || articleId < 1) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <ArticleDetail id={articleId} />
    </main>
  );
}
