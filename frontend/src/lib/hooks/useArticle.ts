import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useArticle(id: number) {
  return useQuery({
    queryKey: queryKeys.article(id),
    queryFn: () => api.getArticle(id),
  });
}
