import type { FieldSlug } from "./fields";

export interface UserBrief {
  id: number;
  full_name: string;
  affiliation: string | null;
}

export interface UserProfile extends UserBrief {
  field: FieldSlug | null;
  bio: string | null;
  followers_count: number;
  followed_by_me: boolean;
  created_at: string;
}

export interface CurrentUser extends UserProfile {
  email: string;
}

export interface Article {
  id: number;
  title: string;
  abstract: string;
  field: FieldSlug;
  tags: string[];
  full_text_url: string | null;
  created_at: string;
  author: UserBrief;
  reactions_count: number;
  comments_count: number;
  reacted_by_me: boolean;
}

export interface Comment {
  id: number;
  body: string;
  created_at: string;
  author: UserBrief;
}

export interface Page<T> {
  items: T[];
  next_cursor: string | null;
}

export interface AuthSession {
  access_token: string;
  token_type: "bearer";
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  full_name: string;
}

export interface ArticleInput {
  title: string;
  abstract: string;
  field: FieldSlug;
  tags: string[];
  full_text_url: string | null;
}
