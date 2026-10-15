"use client";

import { useState } from "react";
import { FeedList } from "@/components/FeedList";
import { FieldFilter } from "@/components/FieldFilter";
import type { FieldSlug } from "@/lib/domain/fields";
import type { Article } from "@/lib/domain/types";

interface FeedViewProps {
  articles: Article[];
}

export function FeedView({ articles }: FeedViewProps) {
  const [field, setField] = useState<FieldSlug | null>(null);
  const visible = field === null ? articles : articles.filter((a) => a.field === field);

  return (
    <section className="flex flex-col gap-4">
      <FieldFilter value={field} onChange={setField} />
      {visible.length === 0 ? (
        <p className="text-slate-500">Brak artykułów w tej dziedzinie.</p>
      ) : (
        <FeedList articles={visible} />
      )}
    </section>
  );
}
