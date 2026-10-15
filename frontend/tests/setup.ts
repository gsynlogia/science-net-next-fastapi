import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { resetApiMock } from "./helpers/apiMock";
import { resetNavigation } from "./helpers/navigation";

vi.mock("@/lib/api", async () => (await import("./helpers/apiMock")).apiModule);
vi.mock("next/navigation", async () => (await import("./helpers/navigation")).navigationModule);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
  resetApiMock();
  resetNavigation();
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
});
