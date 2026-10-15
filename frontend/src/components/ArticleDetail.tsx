"use client";

import { ArticleCard } from "@/components/ArticleCard";
import { CommentsSection } from "@/components/CommentsSection";
import { ReactionButton } from "@/components/ReactionButton";
import { useArticle } from "@/lib/hooks/useArticle";

interface ArticleDetailProps {
  id: number;
}

export function ArticleDetail({ id }: ArticleDetailProps) {
  const article = useArticle(id);

  if (article.isPending) {
    return <p className="text-slate-500">Ładowanie artykułu…</p>;
  }
  if (article.isError) {
    return (
      <p role="alert" className="text-accent-600">
        {article.error.message}
      </p>
    );
  }

  return (
    <>
      <ArticleCard
        article={article.data}
        detailed
        actions={<ReactionButton article={article.data} />}
      />
      <CommentsSection articleId={id} />
    </>
  );
}
