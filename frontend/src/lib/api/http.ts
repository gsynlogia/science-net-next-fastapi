import { z } from "zod";
import { getAccessToken } from "@/lib/auth/tokenStore";
import type { ArticleInput, LoginInput, RegisterInput } from "@/lib/domain/types";
import type { ApiClient, ListArticlesParams, ListCommentsParams } from "./client";
import { ApiError, HttpStatus, NETWORK_ERROR_STATUS } from "./errors";
import {
  articleSchema,
  authSessionSchema,
  commentSchema,
  currentUserSchema,
  pageSchema,
  userProfileSchema,
} from "./schemas";

const API_PREFIX = "/api";
const NETWORK_ERROR_MESSAGE = "Brak połączenia z serwerem. Spróbuj ponownie.";
const INVALID_RESPONSE_MESSAGE = "Serwer zwrócił nieoczekiwaną odpowiedź.";
const UNKNOWN_ERROR_MESSAGE = "Wystąpił nieoczekiwany błąd.";

const errorBodySchema = z.object({
  detail: z.union([z.string(), z.array(z.object({ msg: z.string() }))]),
});

const articlePageSchema = pageSchema(articleSchema);
const commentPageSchema = pageSchema(commentSchema);

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  json?: unknown;
}

async function readErrorMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  const parsed = errorBodySchema.safeParse(body);
  if (!parsed.success) {
    return UNKNOWN_ERROR_MESSAGE;
  }
  const { detail } = parsed.data;
  return typeof detail === "string" ? detail : (detail[0]?.msg ?? UNKNOWN_ERROR_MESSAGE);
}

async function send(path: string, { method = "GET", json }: RequestOptions): Promise<Response> {
  const headers = new Headers();
  const token = getAccessToken();
  if (token !== null) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  let response: Response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, {
      method,
      headers,
      body: json === undefined ? undefined : JSON.stringify(json),
    });
  } catch {
    throw new ApiError(NETWORK_ERROR_STATUS, NETWORK_ERROR_MESSAGE);
  }
  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }
  return response;
}

async function request<Schema extends z.ZodType>(
  path: string,
  schema: Schema,
  options: RequestOptions = {},
): Promise<z.infer<Schema>> {
  const response = await send(path, options);
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) {
    throw new ApiError(HttpStatus.BadGateway, INVALID_RESPONSE_MESSAGE);
  }
  return parsed.data;
}

function listQuery({ cursor, field, query, authorId }: ListArticlesParams): string {
  const params = new URLSearchParams();
  if (cursor !== null) {
    params.set("cursor", cursor);
  }
  if (field !== null) {
    params.set("field", field);
  }
  if (query.trim() !== "") {
    params.set("q", query.trim());
  }
  if (authorId !== null) {
    params.set("author_id", String(authorId));
  }
  return params.toString();
}

export class HttpApi implements ApiClient {
  register(input: RegisterInput) {
    return request("/auth/register", authSessionSchema, { method: "POST", json: input });
  }

  login(input: LoginInput) {
    return request("/auth/login", authSessionSchema, { method: "POST", json: input });
  }

  getMe() {
    return request("/users/me", currentUserSchema);
  }

  listArticles(params: ListArticlesParams) {
    return request(`/articles?${listQuery(params)}`, articlePageSchema);
  }

  getArticle(id: number) {
    return request(`/articles/${id}`, articleSchema);
  }

  createArticle(input: ArticleInput) {
    return request("/articles", articleSchema, { method: "POST", json: input });
  }

  addReaction(articleId: number) {
    return request(`/articles/${articleId}/reaction`, articleSchema, { method: "PUT" });
  }

  removeReaction(articleId: number) {
    return request(`/articles/${articleId}/reaction`, articleSchema, { method: "DELETE" });
  }

  listComments({ articleId, cursor }: ListCommentsParams) {
    const query = cursor === null ? "" : `?cursor=${encodeURIComponent(cursor)}`;
    return request(`/articles/${articleId}/comments${query}`, commentPageSchema);
  }

  addComment(articleId: number, body: string) {
    return request(`/articles/${articleId}/comments`, commentSchema, {
      method: "POST",
      json: { body },
    });
  }

  getUser(id: number) {
    return request(`/users/${id}`, userProfileSchema);
  }

  followUser(id: number) {
    return request(`/users/${id}/follow`, userProfileSchema, { method: "PUT" });
  }

  unfollowUser(id: number) {
    return request(`/users/${id}/follow`, userProfileSchema, { method: "DELETE" });
  }
}
