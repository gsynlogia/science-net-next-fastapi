"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

const STALE_TIME_MS = 30_000;

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: STALE_TIME_MS, retry: false } },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
