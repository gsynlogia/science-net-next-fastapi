import { describe, expect, it } from "vitest";
import { api } from "@/lib/api";
import { HttpApi } from "@/lib/api/http";

describe("api", () => {
  it("jest prawdziwym klientem HTTP", () => {
    expect(api).toBeInstanceOf(HttpApi);
  });
});
