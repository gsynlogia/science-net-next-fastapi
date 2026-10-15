import type { FieldSlug } from "@/lib/domain/fields";

export const queryKeys = {
  articles: ["articles"] as const,
  feeds: ["articles", "feed"] as const,
  feed: (field: FieldSlug | null, query: string, authorId: number | null) =>
    ["articles", "feed", field, query, authorId] as const,
  article: (id: number) => ["articles", "detail", id] as const,
  comments: (articleId: number) => ["articles", "comments", articleId] as const,
  user: (id: number) => ["users", id] as const,
  me: ["me"] as const,
} as const;
