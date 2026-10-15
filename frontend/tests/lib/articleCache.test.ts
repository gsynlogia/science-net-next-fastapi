import { QueryClient, type InfiniteData } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { replaceArticleInCache } from "@/lib/articleCache";
import type { Article, Page } from "@/lib/domain/types";
import { queryKeys } from "@/lib/queryKeys";
import { makeArticle } from "../fixtures";

describe("replaceArticleInCache", () => {
  it("podmienia artykuł w szczegółach i na każdej liście, nie ruszając innych", () => {
    const queryClient = new QueryClient();
    const old = makeArticle({ id: 1, reactions_count: 2 });
    const other = makeArticle({ id: 2 });
    const pages: InfiniteData<Page<Article>> = {
      pages: [
        { items: [old], next_cursor: "1" },
        { items: [other], next_cursor: null },
      ],
      pageParams: [null, "1"],
    };
    queryClient.setQueryData(queryKeys.article(1), old);
    queryClient.setQueryData(queryKeys.feed(null, "", null), pages);
    queryClient.setQueryData(queryKeys.feed("physics", "", 3), pages);

    const updated = makeArticle({ id: 1, reactions_count: 3, reacted_by_me: true });
    replaceArticleInCache(queryClient, updated);

    expect(queryClient.getQueryData(queryKeys.article(1))).toEqual(updated);
    for (const key of [queryKeys.feed(null, "", null), queryKeys.feed("physics", "", 3)]) {
      const data = queryClient.getQueryData<InfiniteData<Page<Article>>>(key);
      expect(data?.pages[0]?.items[0]).toEqual(updated);
      expect(data?.pages[1]?.items[0]).toEqual(other);
      expect(data?.pages[0]?.next_cursor).toBe("1");
    }
  });

  it("pomija listy, które jeszcze nie mają danych", () => {
    const queryClient = new QueryClient();
    queryClient.getQueryCache().build(queryClient, { queryKey: queryKeys.feed(null, "", null) });
    replaceArticleInCache(queryClient, makeArticle());
    expect(queryClient.getQueryData(queryKeys.feed(null, "", null))).toBeUndefined();
  });
});
