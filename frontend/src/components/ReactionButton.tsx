"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/useSession";
import type { Article } from "@/lib/domain/types";
import { useReaction } from "@/lib/hooks/useReaction";

interface ReactionButtonProps {
  article: Article;
}

const BASE_CLASS = "text-slate-600 hover:text-brand-600";
const ACTIVE_CLASS = "font-semibold text-accent-600";

export function ReactionButton({ article }: ReactionButtonProps) {
  const { user, isLoading } = useSession();
  const reaction = useReaction();
  const label = `Przydatne (${article.reactions_count})`;

  if (isLoading) {
    return <span className="text-slate-400">{label}</span>;
  }
  if (user === null) {
    return (
      <Link href="/login" title="Zaloguj się, aby ocenić" className={BASE_CLASS}>
        {label}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-pressed={article.reacted_by_me}
        disabled={reaction.isPending}
        onClick={() => reaction.mutate(article)}
        className={article.reacted_by_me ? ACTIVE_CLASS : BASE_CLASS}
      >
        {label}
      </button>
      {reaction.isError && (
        <span role="alert" className="text-sm text-accent-600">
          {reaction.error.message}
        </span>
      )}
    </>
  );
}
