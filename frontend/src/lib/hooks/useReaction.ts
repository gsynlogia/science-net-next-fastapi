import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { replaceArticleInCache } from "@/lib/articleCache";
import type { Article } from "@/lib/domain/types";

export function useReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (article: Article) =>
      article.reacted_by_me ? api.removeReaction(article.id) : api.addReaction(article.id),
    onSuccess: (updated) => replaceArticleInCache(queryClient, updated),
  });
}
