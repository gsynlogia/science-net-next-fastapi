import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useAddComment(articleId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.addComment(articleId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.articles }),
  });
}
