import { vi, type Mock } from "vitest";
import type { ApiClient } from "@/lib/api/client";

type ApiMock = { [Method in keyof ApiClient]: Mock<ApiClient[Method]> };

export const apiMock: ApiMock = {
  register: vi.fn(),
  login: vi.fn(),
  getMe: vi.fn(),
  listArticles: vi.fn(),
  getArticle: vi.fn(),
  createArticle: vi.fn(),
  addReaction: vi.fn(),
  removeReaction: vi.fn(),
  listComments: vi.fn(),
  addComment: vi.fn(),
  getUser: vi.fn(),
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
};

export const apiModule = { api: apiMock };

export function resetApiMock(): void {
  for (const method of Object.values(apiMock)) {
    method.mockReset();
  }
}
