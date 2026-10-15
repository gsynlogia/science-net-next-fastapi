import { describe, expect, it } from "vitest";
import { articleSchema, parseTags, toArticleInput } from "@/lib/schemas/article";
import { loginSchema, registerSchema } from "@/lib/schemas/auth";
import { COMMENT_MAX_LENGTH, commentSchema } from "@/lib/schemas/comment";

const VALID_ARTICLE = {
  title: "  Nowe odkrycie  ",
  abstract: "Streszczenie liczące więcej niż dwadzieścia znaków.",
  field: "physics",
  tags_text: "AI, ml , ai",
  full_text_url: "https://example.com/praca.pdf",
} as const;

function firstMessage(result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}): string | undefined {
  return result.error?.issues[0]?.message;
}

describe("parseTags", () => {
  it("zamienia tekst na małe litery, przycina spacje i usuwa duplikaty", () => {
    expect(parseTags("AI, ml , ai,, ")).toEqual(["ai", "ml"]);
  });
});

describe("articleSchema", () => {
  it("przepuszcza poprawne dane i przycina tytuł", () => {
    const result = articleSchema.safeParse(VALID_ARTICLE);
    expect(result.success).toBe(true);
    expect(result.data?.title).toBe("Nowe odkrycie");
  });

  it.each([
    ["za krótki tytuł", { title: "abc" }, "Tytuł musi mieć co najmniej 5 znaków."],
    [
      "za długie streszczenie",
      { abstract: "x".repeat(2001) },
      "Streszczenie może mieć najwyżej 2000 znaków.",
    ],
    ["za dużo tagów", { tags_text: "a,b,c,d,e,f" }, "Najwyżej 5 tagów."],
    ["za długi tag", { tags_text: "x".repeat(31) }, "Tag może mieć najwyżej 30 znaków."],
    [
      "adres z innym protokołem",
      { full_text_url: "ftp://example.com" },
      "Podaj poprawny adres http lub https.",
    ],
    [
      "adres bez protokołu",
      { full_text_url: "example.com" },
      "Podaj poprawny adres http lub https.",
    ],
  ])("odrzuca: %s", (_name, changes, message) => {
    const result = articleSchema.safeParse({ ...VALID_ARTICLE, ...changes });
    expect(firstMessage(result)).toBe(message);
  });

  it("zezwala na pusty adres do pełnego tekstu", () => {
    expect(articleSchema.safeParse({ ...VALID_ARTICLE, full_text_url: "" }).success).toBe(true);
  });

  it("wymaga wyboru dziedziny", () => {
    expect(firstMessage(articleSchema.safeParse({ ...VALID_ARTICLE, field: "" }))).toBe(
      "Wybierz dziedzinę.",
    );
  });
});

describe("toArticleInput", () => {
  it("zamienia tagi na listę, a pusty adres na null", () => {
    const parsed = articleSchema.parse({ ...VALID_ARTICLE, full_text_url: "" });
    expect(toArticleInput(parsed)).toEqual({
      title: "Nowe odkrycie",
      abstract: VALID_ARTICLE.abstract,
      field: "physics",
      tags: ["ai", "ml"],
      full_text_url: null,
    });
  });

  it("zachowuje podany adres", () => {
    expect(toArticleInput(articleSchema.parse(VALID_ARTICLE)).full_text_url).toBe(
      "https://example.com/praca.pdf",
    );
  });
});

describe("loginSchema i registerSchema", () => {
  it("logowanie wymaga poprawnego e-maila i niepustego hasła", () => {
    expect(loginSchema.safeParse({ email: "ada@example.com", password: "x" }).success).toBe(true);
    expect(firstMessage(loginSchema.safeParse({ email: "zle", password: "x" }))).toBe(
      "Podaj poprawny adres e-mail.",
    );
    expect(firstMessage(loginSchema.safeParse({ email: "ada@example.com", password: "" }))).toBe(
      "Podaj hasło.",
    );
  });

  it("rejestracja sprawdza imię, długość hasła i zgodność powtórzenia", () => {
    const valid = {
      full_name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Haslo12345!",
      password_confirm: "Haslo12345!",
    };
    expect(registerSchema.safeParse(valid).success).toBe(true);
    expect(firstMessage(registerSchema.safeParse({ ...valid, full_name: " a " }))).toBe(
      "Podaj imię i nazwisko.",
    );
    expect(
      firstMessage(
        registerSchema.safeParse({ ...valid, password: "krotkie", password_confirm: "krotkie" }),
      ),
    ).toBe("Hasło musi mieć co najmniej 8 znaków.");
    expect(
      firstMessage(registerSchema.safeParse({ ...valid, password_confirm: "inne-haslo" })),
    ).toBe("Hasła nie są takie same.");
  });
});

describe("commentSchema", () => {
  it("przycina spacje i odrzuca pusty oraz za długi komentarz", () => {
    expect(commentSchema.parse({ body: "  Hej  " }).body).toBe("Hej");
    expect(firstMessage(commentSchema.safeParse({ body: "   " }))).toBe("Napisz komentarz.");
    expect(
      firstMessage(commentSchema.safeParse({ body: "x".repeat(COMMENT_MAX_LENGTH + 1) })),
    ).toBe("Komentarz może mieć najwyżej 1000 znaków.");
  });
});
