import type { FieldSlug } from "@/lib/domain/fields";
import type {
  Article,
  ArticleInput,
  AuthSession,
  Comment,
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

export interface ListCommentsParams {
  articleId: number;
  cursor: string | null;
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
  listComments(params: ListCommentsParams): Promise<Page<Comment>>;
  addComment(articleId: number, body: string): Promise<Comment>;
}
