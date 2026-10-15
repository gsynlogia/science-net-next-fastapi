import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Article } from "@/lib/domain/types";
import { queryKeys } from "@/lib/queryKeys";

export function useArticle(id: number, initialArticle: Article) {
  return useQuery({
    queryKey: queryKeys.article(id),
    queryFn: () => api.getArticle(id),
    initialData: initialArticle,
    initialDataUpdatedAt: 0,
  });
}
