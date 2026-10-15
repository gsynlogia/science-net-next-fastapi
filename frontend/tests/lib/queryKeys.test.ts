import { describe, expect, it } from "vitest";
import { queryKeys } from "@/lib/queryKeys";

describe("queryKeys", () => {
  it("każdy klucz zaczyna się od przedrostka grupy", () => {
    expect(queryKeys.feed("physics", "ai", 3).slice(0, 2)).toEqual(queryKeys.feeds);
    expect(queryKeys.article(5)[0]).toBe(queryKeys.articles[0]);
    expect(queryKeys.comments(5)[0]).toBe(queryKeys.articles[0]);
  });

  it("klucze różnych danych się różnią", () => {
    expect(queryKeys.feed(null, "", null)).not.toEqual(queryKeys.feed(null, "", 3));
    expect(queryKeys.user(1)).not.toEqual(queryKeys.user(2));
    expect(queryKeys.me).toEqual(["me"]);
  });
});
