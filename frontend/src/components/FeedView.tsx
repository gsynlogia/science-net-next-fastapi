"use client";

import { useState } from "react";
import { FeedList } from "@/components/FeedList";
import { FieldFilter } from "@/components/FieldFilter";
import type { FieldSlug } from "@/lib/domain/fields";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useFeed } from "@/lib/hooks/useFeed";

const SEARCH_DEBOUNCE_MS = 400;

export function FeedView() {
  const [field, setField] = useState<FieldSlug | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const feed = useFeed(field, debouncedSearch);
  const articles = feed.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="search"
          aria-label="Szukaj artykułów"
          placeholder="Szukaj po tytule lub tagu…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
        />
        <FieldFilter value={field} onChange={setField} />
      </div>
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
    </section>
  );
}
