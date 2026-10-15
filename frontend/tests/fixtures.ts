import type { Article, Comment, CurrentUser, UserProfile } from "@/lib/domain/types";

export function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 1,
    title: "Sieci neuronowe w medycynie",
    abstract: "Przegląd zastosowań sieci neuronowych w diagnostyce obrazowej.",
    field: "medicine",
    tags: ["ai", "medycyna"],
    full_text_url: "https://example.com/artykul.pdf",
    created_at: "2026-03-01T10:00:00Z",
    author: { id: 7, full_name: "Ada Lovelace", affiliation: "Politechnika Gdańska" },
    reactions_count: 2,
    comments_count: 1,
    reacted_by_me: false,
    ...overrides,
  };
}

export function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 7,
    full_name: "Ada Lovelace",
    affiliation: "Politechnika Gdańska",
    field: "computer_science",
    bio: "Pierwsza programistka.",
    followers_count: 3,
    followed_by_me: false,
    created_at: "2026-01-10T09:00:00Z",
    ...overrides,
  };
}

export function makeCurrentUser(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return { ...makeProfile(), email: "ada@example.com", ...overrides };
}

export function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 11,
    body: "Ciekawa praca!",
    created_at: "2026-03-02T12:00:00Z",
    author: { id: 8, full_name: "Jan Nowak", affiliation: null },
    ...overrides,
  };
}
