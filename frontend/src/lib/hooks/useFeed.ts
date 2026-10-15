import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FieldSlug } from "@/lib/domain/fields";
import { queryKeys } from "@/lib/queryKeys";

export function useFeed(field: FieldSlug | null, query: string, authorId: number | null = null) {
  return useInfiniteQuery({
    queryKey: queryKeys.feed(field, query, authorId),
    queryFn: ({ pageParam }) => api.listArticles({ cursor: pageParam, field, query, authorId }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
  });
}
