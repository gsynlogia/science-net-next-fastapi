"use client";

import { Avatar } from "@/components/Avatar";
import { CommentForm } from "@/components/CommentForm";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { useComments } from "@/lib/hooks/useComments";

interface CommentsSectionProps {
  articleId: number;
}

export function CommentsSection({ articleId }: CommentsSectionProps) {
  const comments = useComments(articleId);
  const items = comments.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <section aria-labelledby="comments-heading" className="mt-6 flex flex-col gap-4">
      <h2 id="comments-heading" className="text-lg font-semibold text-slate-800">
        Komentarze
      </h2>
      <CommentForm articleId={articleId} />
      {comments.isPending && <p className="text-slate-500">Ładowanie komentarzy…</p>}
      {comments.isError && (
        <p role="alert" className="text-accent-600">
          {comments.error.message}
        </p>
      )}
      {comments.isSuccess && items.length === 0 && (
        <p className="text-slate-500">Nie ma jeszcze komentarzy. Napisz pierwszy!</p>
      )}
      <ul className="flex flex-col gap-3">
        {items.map((comment) => (
          <li key={comment.id} className="flex gap-3 rounded-xl bg-white p-4 shadow-sm">
            <Avatar name={comment.author.full_name} />
            <div>
              <p className="text-sm text-slate-500">
                <Link
                  href={`/users/${comment.author.id}`}
                  className="font-semibold text-slate-800 hover:underline"
                >
                  {comment.author.full_name}
                </Link>
                {" · "}
                {formatDate(comment.created_at)}
              </p>
              <p className="mt-1 whitespace-pre-line text-slate-700">{comment.body}</p>
            </div>
          </li>
        ))}
      </ul>
      {comments.hasNextPage && (
        <button
          type="button"
          onClick={() => comments.fetchNextPage()}
          disabled={comments.isFetchingNextPage}
          className="self-start text-sm font-medium text-brand-600 hover:underline disabled:opacity-50"
        >
          {comments.isFetchingNextPage ? "Ładowanie…" : "Pokaż więcej komentarzy"}
        </button>
      )}
    </section>
  );
}
