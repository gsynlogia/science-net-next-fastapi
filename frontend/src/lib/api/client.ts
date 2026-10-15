import type { FieldSlug } from "@/lib/domain/fields";
import type {
  Article,
  ArticleInput,
  AuthSession,
  CurrentUser,
  LoginInput,
  Page,
  RegisterInput,
} from "@/lib/domain/types";

export interface ListArticlesParams {
  cursor: string | null;
  field: FieldSlug | null;
  query: string;
}

export interface ApiClient {
  register(input: RegisterInput): Promise<AuthSession>;
  login(input: LoginInput): Promise<AuthSession>;
  getMe(): Promise<CurrentUser>;
  listArticles(params: ListArticlesParams): Promise<Page<Article>>;
  getArticle(id: number): Promise<Article>;
  createArticle(input: ArticleInput): Promise<Article>;
  addReaction(articleId: number): Promise<Article>;
  removeReaction(articleId: number): Promise<Article>;
}
