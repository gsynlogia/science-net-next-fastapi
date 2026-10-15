import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ApiError, HttpStatus } from "@/lib/api/errors";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/auth/tokenStore";
import type { CurrentUser } from "@/lib/domain/types";
import { queryKeys } from "@/lib/queryKeys";

async function fetchCurrentUser(): Promise<CurrentUser | null> {
  if (getAccessToken() === null) {
    return null;
  }
  try {
    return await api.getMe();
  } catch (error) {
    if (error instanceof ApiError && error.status === HttpStatus.Unauthorized) {
      clearAccessToken();
      return null;
    }
    throw error;
  }
}

export function useSession() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.me, queryFn: fetchCurrentUser });

  const signIn = async (token: string): Promise<void> => {
    setAccessToken(token);
    await queryClient.invalidateQueries({ queryKey: queryKeys.me });
    await queryClient.invalidateQueries({ queryKey: queryKeys.articles });
  };

  const signOut = (): void => {
    clearAccessToken();
    queryClient.setQueryData(queryKeys.me, null);
    queryClient.invalidateQueries({ queryKey: queryKeys.articles });
  };

  return { user: query.data ?? null, isLoading: query.isPending, signIn, signOut };
}
