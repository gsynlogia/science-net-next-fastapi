import type { ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { FieldBadge } from "@/components/FieldBadge";
import { TagList } from "@/components/TagList";
import type { Article } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";

interface ArticleCardProps {
  article: Article;
  actions?: ReactNode;
}

export function ArticleCard({ article, actions }: ArticleCardProps) {
  return (
    <article className="rounded-xl bg-white p-5 shadow-sm">
      <header className="flex items-center gap-3">
        <Avatar name={article.author.full_name} />
        <div>
          <p className="font-semibold">{article.author.full_name}</p>
          <p className="text-xs text-slate-500">
            {article.author.affiliation ?? "Brak afiliacji"} · {formatDate(article.created_at)}
          </p>
        </div>
      </header>
      <h2 className="mt-4 text-lg font-bold text-brand-700">{article.title}</h2>
      <p className="mt-2 text-slate-700">{article.abstract}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <FieldBadge field={article.field} />
        <TagList tags={article.tags} />
      </div>
      <footer className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-sm">
        {actions}
        <span className="text-slate-500">Komentarze: {article.comments_count}</span>
      </footer>
    </article>
  );
}
