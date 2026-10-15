import { describe, expect, it } from "vitest";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/auth/tokenStore";

describe("tokenStore w przeglądarce", () => {
  it("nie ma tokenu na początku", () => {
    expect(getAccessToken()).toBeNull();
  });

  it("zapamiętuje i usuwa token", () => {
    setAccessToken("abc");
    expect(getAccessToken()).toBe("abc");
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });
});
