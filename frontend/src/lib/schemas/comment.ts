import { z } from "zod";

const COMMENT_MIN_LENGTH = 1;
export const COMMENT_MAX_LENGTH = 1000;

export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(COMMENT_MIN_LENGTH, "Napisz komentarz.")
    .max(COMMENT_MAX_LENGTH, `Komentarz może mieć najwyżej ${COMMENT_MAX_LENGTH} znaków.`),
});

export type CommentValues = z.infer<typeof commentSchema>;
