"use client";

import { useState } from "react";
import { FeedResults } from "@/components/FeedResults";
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
      <FeedResults feed={feed} />
    </section>
  );
}
