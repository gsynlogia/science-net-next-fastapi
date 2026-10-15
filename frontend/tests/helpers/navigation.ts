import { vi } from "vitest";

export const NOT_FOUND_ERROR = "NEXT_NOT_FOUND";

export const router = { push: vi.fn() };

let pathname = "/";

export function setPathname(value: string): void {
  pathname = value;
}

export const navigationModule = {
  useRouter: () => router,
  usePathname: () => pathname,
  notFound: (): never => {
    throw new Error(NOT_FOUND_ERROR);
  },
};

export function resetNavigation(): void {
  router.push.mockReset();
  pathname = "/";
}
