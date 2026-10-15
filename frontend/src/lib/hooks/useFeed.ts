import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FieldSlug } from "@/lib/domain/fields";
import { queryKeys } from "@/lib/queryKeys";

export function useFeed(field: FieldSlug | null, query: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.feed(field, query),
    queryFn: ({ pageParam }) => api.listArticles({ cursor: pageParam, field, query }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
  });
}
