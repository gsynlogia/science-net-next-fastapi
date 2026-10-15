import { cache } from "react";
import type { Article } from "@/lib/domain/types";
import { HttpStatus } from "./errors";
import { articleSchema } from "./schemas";

const ARTICLE_REVALIDATE_SECONDS = 60;

function getBackendUrl(): string {
  const url = process.env.BACKEND_URL;
  if (!url) {
    throw new Error("Brak zmiennej BACKEND_URL.");
  }
  return url;
}

export const fetchArticle = cache(async (id: number): Promise<Article | null> => {
  const response = await fetch(`${getBackendUrl()}/api/articles/${id}`, {
    next: { revalidate: ARTICLE_REVALIDATE_SECONDS },
  });
  if (response.status === HttpStatus.NotFound) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Backend zwrócił kod ${response.status}.`);
  }
  return articleSchema.parse(await response.json());
});
