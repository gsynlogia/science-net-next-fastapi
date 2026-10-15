import { ArticleCard } from "@/components/ArticleCard";
import { ReactionButton } from "@/components/ReactionButton";
import type { Article } from "@/lib/domain/types";

interface FeedListProps {
  articles: Article[];
}

export function FeedList({ articles }: FeedListProps) {
  return (
    <div className="flex flex-col gap-4">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          actions={<ReactionButton article={article} />}
        />
      ))}
    </div>
  );
}
