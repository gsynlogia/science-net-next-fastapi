import { describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { HttpApi } from "@/lib/api/http";

vi.unmock("@/lib/api");

describe("api", () => {
  it("jest prawdziwym klientem HTTP", () => {
    expect(api).toBeInstanceOf(HttpApi);
  });
});
