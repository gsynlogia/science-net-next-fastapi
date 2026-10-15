import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { UserProfile } from "@/lib/domain/types";
import { queryKeys } from "@/lib/queryKeys";

export function useFollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: UserProfile) =>
      profile.followed_by_me ? api.unfollowUser(profile.id) : api.followUser(profile.id),
    onSuccess: (updated) => queryClient.setQueryData(queryKeys.user(updated.id), updated),
  });
}
