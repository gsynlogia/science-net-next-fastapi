import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { Article, Page } from "@/lib/domain/types";
import { queryKeys } from "@/lib/queryKeys";

export function replaceArticleInCache(queryClient: QueryClient, article: Article): void {
  queryClient.setQueryData(queryKeys.article(article.id), article);
  queryClient.setQueriesData<InfiniteData<Page<Article>>>({ queryKey: queryKeys.feeds }, (data) => {
    if (data === undefined) {
      return data;
    }
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.map((item) => (item.id === article.id ? article : item)),
      })),
    };
  });
}
