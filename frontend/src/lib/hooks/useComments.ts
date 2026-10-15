import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useComments(articleId: number) {
  return useInfiniteQuery({
    queryKey: queryKeys.comments(articleId),
    queryFn: ({ pageParam }) => api.listComments({ articleId, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
  });
}
