import { z } from "zod";
import { FIELD_SLUGS } from "@/lib/domain/fields";
import type { ArticleInput } from "@/lib/domain/types";

const TITLE_MIN_LENGTH = 5;
const TITLE_MAX_LENGTH = 200;
const ABSTRACT_MIN_LENGTH = 20;
const ABSTRACT_MAX_LENGTH = 2000;
const MAX_TAGS = 5;
const TAG_MAX_LENGTH = 30;
const ALLOWED_PROTOCOLS = ["http:", "https:"];

export function parseTags(text: string): string[] {
  const tags = text
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag !== "");
  return [...new Set(tags)];
}

function isHttpUrl(value: string): boolean {
  if (!URL.canParse(value)) {
    return false;
  }
  return ALLOWED_PROTOCOLS.includes(new URL(value).protocol);
}

export const articleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(TITLE_MIN_LENGTH, `Tytuł musi mieć co najmniej ${TITLE_MIN_LENGTH} znaków.`)
    .max(TITLE_MAX_LENGTH, `Tytuł może mieć najwyżej ${TITLE_MAX_LENGTH} znaków.`),
  abstract: z
    .string()
    .trim()
    .min(ABSTRACT_MIN_LENGTH, `Streszczenie musi mieć co najmniej ${ABSTRACT_MIN_LENGTH} znaków.`)
    .max(ABSTRACT_MAX_LENGTH, `Streszczenie może mieć najwyżej ${ABSTRACT_MAX_LENGTH} znaków.`),
  field: z.enum(FIELD_SLUGS, "Wybierz dziedzinę."),
  tags_text: z
    .string()
    .refine((text) => parseTags(text).length <= MAX_TAGS, `Najwyżej ${MAX_TAGS} tagów.`)
    .refine(
      (text) => parseTags(text).every((tag) => tag.length <= TAG_MAX_LENGTH),
      `Tag może mieć najwyżej ${TAG_MAX_LENGTH} znaków.`,
    ),
  full_text_url: z
    .string()
    .refine((value) => value === "" || isHttpUrl(value), "Podaj poprawny adres http lub https."),
});

export type ArticleFormValues = z.infer<typeof articleSchema>;

export function toArticleInput(values: ArticleFormValues): ArticleInput {
  return {
    title: values.title,
    abstract: values.abstract,
    field: values.field,
    tags: parseTags(values.tags_text),
    full_text_url: values.full_text_url === "" ? null : values.full_text_url,
  };
}
