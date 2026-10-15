import { z } from "zod";
import { FIELD_SLUGS } from "@/lib/domain/fields";
import type {
  Article,
  AuthSession,
  Comment,
  CurrentUser,
  Page,
  UserBrief,
  UserProfile,
} from "@/lib/domain/types";

const fieldSchema = z.enum(FIELD_SLUGS);

const userBriefShape = {
  id: z.number(),
  full_name: z.string(),
  affiliation: z.string().nullable(),
};

const userBriefSchema = z.object(userBriefShape) satisfies z.ZodType<UserBrief>;

const userProfileShape = {
  ...userBriefShape,
  field: fieldSchema.nullable(),
  bio: z.string().nullable(),
  followers_count: z.number(),
  followed_by_me: z.boolean(),
  created_at: z.string(),
};

export const userProfileSchema = z.object(userProfileShape) satisfies z.ZodType<UserProfile>;

export const currentUserSchema = z.object({
  ...userProfileShape,
  email: z.string(),
}) satisfies z.ZodType<CurrentUser>;

export const articleSchema = z.object({
  id: z.number(),
  title: z.string(),
  abstract: z.string(),
  field: fieldSchema,
  tags: z.array(z.string()),
  full_text_url: z.string().nullable(),
  created_at: z.string(),
  author: userBriefSchema,
  reactions_count: z.number(),
  comments_count: z.number(),
  reacted_by_me: z.boolean(),
}) satisfies z.ZodType<Article>;

export const commentSchema = z.object({
  id: z.number(),
  body: z.string(),
  created_at: z.string(),
  author: userBriefSchema,
}) satisfies z.ZodType<Comment>;

export const authSessionSchema = z.object({
  access_token: z.string(),
  token_type: z.literal("bearer"),
}) satisfies z.ZodType<AuthSession>;

export function pageSchema<Item extends z.ZodType>(item: Item) {
  return z.object({ items: z.array(item), next_cursor: z.string().nullable() }) satisfies z.ZodType<
    Page<z.infer<Item>>
  >;
}
