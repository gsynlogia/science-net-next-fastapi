import { getAccessToken } from "@/lib/auth/tokenStore";
import type {
  Article,
  ArticleInput,
  AuthSession,
  CurrentUser,
  LoginInput,
  Page,
  RegisterInput,
} from "@/lib/domain/types";
import { MOCK_ARTICLES, MOCK_USERS, toBrief } from "@/lib/mock/data";
import type { ApiClient, ListArticlesParams } from "./client";
import { ApiError, HttpStatus } from "./errors";

const LATENCY_MS = 300;
const MOCK_PAGE_SIZE = 3;
const MOCK_PASSWORD = "Haslo12345!";
const SEED_EMAILS = ["anna@example.com", "jan@example.com", "maria@example.com"];
const TOKEN_PREFIX = "mock-token-";

interface MockAccount {
  user: CurrentUser;
  password: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchesQuery(article: Article, needle: string): boolean {
  if (needle === "") {
    return true;
  }
  const inTitle = article.title.toLowerCase().includes(needle);
  const inTags = article.tags.some((tag) => tag.includes(needle));
  return inTitle || inTags;
}

export class MockApi implements ApiClient {
  private articles: Article[] = [...MOCK_ARTICLES];
  private accounts: MockAccount[] = MOCK_USERS.map((user, index) => ({
    user: { ...user, email: SEED_EMAILS[index] },
    password: MOCK_PASSWORD,
  }));

  private requireAccount(): MockAccount {
    const token = getAccessToken();
    const account = this.accounts.find((item) => `${TOKEN_PREFIX}${item.user.id}` === token);
    if (!account) {
      throw new ApiError(HttpStatus.Unauthorized, "Zaloguj się, aby kontynuować.");
    }
    return account;
  }

  private createSession(user: CurrentUser): AuthSession {
    return { access_token: `${TOKEN_PREFIX}${user.id}`, token_type: "bearer" };
  }

  async register(input: RegisterInput): Promise<AuthSession> {
    await delay(LATENCY_MS);
    if (this.accounts.some((item) => item.user.email === input.email)) {
      throw new ApiError(HttpStatus.Conflict, "Konto z tym adresem e-mail już istnieje.");
    }
    const user: CurrentUser = {
      id: Math.max(...this.accounts.map((item) => item.user.id)) + 1,
      full_name: input.full_name,
      email: input.email,
      affiliation: null,
      field: null,
      bio: null,
      followers_count: 0,
      followed_by_me: false,
      created_at: new Date().toISOString(),
    };
    this.accounts.push({ user, password: input.password });
    return this.createSession(user);
  }

  async login(input: LoginInput): Promise<AuthSession> {
    await delay(LATENCY_MS);
    const account = this.accounts.find(
      (item) => item.user.email === input.email && item.password === input.password,
    );
    if (!account) {
      throw new ApiError(HttpStatus.Unauthorized, "Nieprawidłowy e-mail lub hasło.");
    }
    return this.createSession(account.user);
  }

  async getMe(): Promise<CurrentUser> {
    await delay(LATENCY_MS);
    return this.requireAccount().user;
  }

  async listArticles({ cursor, field, query }: ListArticlesParams): Promise<Page<Article>> {
    await delay(LATENCY_MS);
    const before = cursor === null ? Number.POSITIVE_INFINITY : Number(cursor);
    const needle = query.trim().toLowerCase();
    const matching = this.articles
      .filter((article) => article.id < before)
      .filter((article) => field === null || article.field === field)
      .filter((article) => matchesQuery(article, needle))
      .sort((a, b) => b.id - a.id);
    const items = matching.slice(0, MOCK_PAGE_SIZE);
    const last = items.at(-1);
    const hasMore = matching.length > MOCK_PAGE_SIZE;
    return { items, next_cursor: hasMore && last ? String(last.id) : null };
  }

  async getArticle(id: number): Promise<Article> {
    await delay(LATENCY_MS);
    const article = this.articles.find((item) => item.id === id);
    if (!article) {
      throw new ApiError(HttpStatus.NotFound, "Nie znaleziono artykułu.");
    }
    return article;
  }

  async createArticle(input: ArticleInput): Promise<Article> {
    await delay(LATENCY_MS);
    const account = this.requireAccount();
    const article: Article = {
      ...input,
      id: Math.max(...this.articles.map((item) => item.id)) + 1,
      created_at: new Date().toISOString(),
      author: toBrief(account.user),
      reactions_count: 0,
      comments_count: 0,
      reacted_by_me: false,
    };
    this.articles.push(article);
    return article;
  }
}
