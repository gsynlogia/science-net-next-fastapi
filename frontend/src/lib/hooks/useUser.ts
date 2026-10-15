import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useUser(id: number) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => api.getUser(id),
  });
}
