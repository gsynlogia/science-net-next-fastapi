import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { setAccessToken } from "@/lib/auth/tokenStore";
import type { CurrentUser } from "@/lib/domain/types";
import { makeCurrentUser } from "../fixtures";
import { apiMock } from "./apiMock";

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

export function renderWithClient(ui: ReactElement, queryClient = createTestQueryClient()) {
  return { ...render(ui, { wrapper: wrapperFor(queryClient) }), queryClient };
}

export function signInAs(user: CurrentUser = makeCurrentUser()): CurrentUser {
  setAccessToken("test-token");
  apiMock.getMe.mockResolvedValue(user);
  return user;
}
