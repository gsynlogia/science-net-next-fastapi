"use client";

import { ArticleCard } from "@/components/ArticleCard";
import { ArticleSummary } from "@/components/ArticleSummary";
import { CommentsSection } from "@/components/CommentsSection";
import { ReactionButton } from "@/components/ReactionButton";
import type { Article } from "@/lib/domain/types";
import { useArticle } from "@/lib/hooks/useArticle";

interface ArticleDetailProps {
  id: number;
  initialArticle: Article;
}

export function ArticleDetail({ id, initialArticle }: ArticleDetailProps) {
  const article = useArticle(id, initialArticle);

  return (
    <>
      {article.isError && (
        <p role="alert" className="mb-3 text-accent-600">
          {article.error.message}
        </p>
      )}
      <ArticleCard
        article={article.data}
        detailed
        actions={<ReactionButton article={article.data} />}
      />
      <ArticleSummary articleId={id} />
      <CommentsSection articleId={id} />
    </>
  );
}
