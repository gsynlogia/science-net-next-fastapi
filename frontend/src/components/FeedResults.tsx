"use client";

import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { FeedList } from "@/components/FeedList";
import type { Article, Page } from "@/lib/domain/types";

interface FeedResultsProps {
  feed: UseInfiniteQueryResult<InfiniteData<Page<Article>>, Error>;
}

export function FeedResults({ feed }: FeedResultsProps) {
  const articles = feed.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      {feed.isPending && <p className="text-slate-500">Ładowanie artykułów…</p>}
      {feed.isError && (
        <p role="alert" className="text-accent-600">
          {feed.error.message}
        </p>
      )}
      {feed.isSuccess && articles.length === 0 && (
        <p className="text-slate-500">Brak artykułów spełniających kryteria.</p>
      )}
      <FeedList articles={articles} />
      {feed.hasNextPage && (
        <button
          type="button"
          onClick={() => feed.fetchNextPage()}
          disabled={feed.isFetchingNextPage}
          className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {feed.isFetchingNextPage ? "Ładowanie…" : "Pokaż więcej"}
        </button>
      )}
    </>
  );
}
