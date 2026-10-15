import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleDetail } from "@/components/ArticleDetail";
import { fetchArticle } from "@/lib/api/server";

const DESCRIPTION_MAX_LENGTH = 160;

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

async function loadArticle(params: ArticlePageProps["params"]) {
  const { id } = await params;
  const articleId = Number(id);
  if (!Number.isInteger(articleId) || articleId < 1) {
    notFound();
  }
  const article = await fetchArticle(articleId);
  if (article === null) {
    notFound();
  }
  return article;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = await loadArticle(params);
  const description = article.abstract.slice(0, DESCRIPTION_MAX_LENGTH);
  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      type: "article",
      publishedTime: article.created_at,
      authors: [article.author.full_name],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await loadArticle(params);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <ArticleDetail id={article.id} initialArticle={article} />
    </main>
  );
}
