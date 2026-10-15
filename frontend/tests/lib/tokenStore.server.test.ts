// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getAccessToken } from "@/lib/auth/tokenStore";

describe("tokenStore na serwerze", () => {
  it("zwraca null, bo serwer nie ma localStorage", () => {
    expect(getAccessToken()).toBeNull();
  });
});
