import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, NETWORK_ERROR_STATUS } from "@/lib/api/errors";
import { HttpApi } from "@/lib/api/http";
import { setAccessToken } from "@/lib/auth/tokenStore";
import type { ArticleInput } from "@/lib/domain/types";
import { makeArticle, makeComment, makeCurrentUser, makeProfile } from "../fixtures";

const api = new HttpApi();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function stubFetch(response: Response): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(() => Promise.resolve(response));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function lastRequest(fetchMock: ReturnType<typeof vi.fn>): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.lastCall as [string, RequestInit];
  return { url, init };
}

function headerOf(init: RequestInit, name: string): string | null {
  return new Headers(init.headers).get(name);
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("HttpApi — żądania", () => {
  it("dołącza token i odczytuje profil zalogowanego", async () => {
    setAccessToken("tok");
    const fetchMock = stubFetch(json(makeCurrentUser()));
    const me = await api.getMe();
    const { url, init } = lastRequest(fetchMock);
    expect(url).toBe("/api/users/me");
    expect(headerOf(init, "Authorization")).toBe("Bearer tok");
    expect(me.email).toBe("ada@example.com");
  });

  it("nie wysyła nagłówka Authorization bez tokenu", async () => {
    const fetchMock = stubFetch(json(makeArticle()));
    await api.getArticle(1);
    expect(headerOf(lastRequest(fetchMock).init, "Authorization")).toBeNull();
  });

  it("buduje adres listy artykułów z parametrów", async () => {
    const page = { items: [makeArticle()], next_cursor: "5" };
    const fetchMock = stubFetch(json(page));
    await api.listArticles({ cursor: "9", field: "physics", query: "  ai  ", authorId: 3 });
    expect(lastRequest(fetchMock).url).toBe(
      "/api/articles?cursor=9&field=physics&q=ai&author_id=3",
    );
  });

  it("pomija puste filtry listy", async () => {
    const fetchMock = stubFetch(json({ items: [], next_cursor: null }));
    await api.listArticles({ cursor: null, field: null, query: "  ", authorId: null });
    expect(lastRequest(fetchMock).url).toBe("/api/articles?");
  });

  it("wysyła dane jako JSON metodą POST", async () => {
    const fetchMock = stubFetch(json(makeArticle(), 201));
    const input: ArticleInput = {
      title: "Tytuł",
      abstract: "Streszczenie",
      field: "physics",
      tags: ["ai"],
      full_text_url: null,
    };
    await api.createArticle(input);
    const { url, init } = lastRequest(fetchMock);
    expect(init.method).toBe("POST");
    expect(url).toBe("/api/articles");
    expect(headerOf(init, "Content-Type")).toBe("application/json");
    expect(JSON.parse(String(init.body))).toEqual(input);
  });

  it("logowanie i rejestracja używają POST na właściwych adresach", async () => {
    const session = { access_token: "t", token_type: "bearer" };
    const fetchMock = stubFetch(json(session));
    await api.login({ email: "ada@example.com", password: "x" });
    expect(lastRequest(fetchMock).url).toBe("/api/auth/login");
    fetchMock.mockImplementation(() => Promise.resolve(json(session)));
    await api.register({ email: "ada@example.com", password: "x", full_name: "Ada Lovelace" });
    expect(lastRequest(fetchMock).url).toBe("/api/auth/register");
  });

  it("reakcje: PUT dodaje, DELETE cofa", async () => {
    const fetchMock = stubFetch(json(makeArticle()));
    await api.addReaction(4);
    expect(lastRequest(fetchMock).init.method).toBe("PUT");
    expect(lastRequest(fetchMock).url).toBe("/api/articles/4/reaction");
    fetchMock.mockImplementation(() => Promise.resolve(json(makeArticle())));
    await api.removeReaction(4);
    expect(lastRequest(fetchMock).init.method).toBe("DELETE");
  });

  it("komentarze: lista z kursorem i dodawanie", async () => {
    const page = { items: [makeComment()], next_cursor: null };
    const fetchMock = stubFetch(json(page));
    await api.listComments({ articleId: 2, cursor: null });
    expect(lastRequest(fetchMock).url).toBe("/api/articles/2/comments");
    fetchMock.mockImplementation(() => Promise.resolve(json(page)));
    await api.listComments({ articleId: 2, cursor: "5" });
    expect(lastRequest(fetchMock).url).toBe("/api/articles/2/comments?cursor=5");
    fetchMock.mockImplementation(() => Promise.resolve(json(makeComment(), 201)));
    await api.addComment(2, "Hej");
    expect(JSON.parse(String(lastRequest(fetchMock).init.body))).toEqual({ body: "Hej" });
  });

  it("profile: odczyt oraz obserwowanie (PUT) i cofnięcie (DELETE)", async () => {
    const fetchMock = stubFetch(json(makeProfile()));
    await api.getUser(7);
    expect(lastRequest(fetchMock).url).toBe("/api/users/7");
    fetchMock.mockImplementation(() => Promise.resolve(json(makeProfile())));
    await api.followUser(7);
    expect(lastRequest(fetchMock).init.method).toBe("PUT");
    fetchMock.mockImplementation(() => Promise.resolve(json(makeProfile())));
    await api.unfollowUser(7);
    expect(lastRequest(fetchMock).init.method).toBe("DELETE");
  });
});

describe("HttpApi — błędy", () => {
  async function failureOf(response: Response): Promise<ApiError> {
    stubFetch(response);
    const error: unknown = await api.getArticle(1).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }

  it("używa komunikatu tekstowego z pola detail", async () => {
    const error = await failureOf(json({ detail: "Nie znaleziono artykułu." }, 404));
    expect(error.status).toBe(404);
    expect(error.message).toBe("Nie znaleziono artykułu.");
  });

  it("bierze pierwszy komunikat z listy błędów walidacji", async () => {
    const error = await failureOf(json({ detail: [{ msg: "Pierwszy" }, { msg: "Drugi" }] }, 422));
    expect(error.message).toBe("Pierwszy");
  });

  it("zastępuje pustą listę i nieznany kształt komunikatem ogólnym", async () => {
    const emptyList = await failureOf(json({ detail: [] }, 422));
    const unknownShape = await failureOf(json({ message: "inne pole" }, 500));
    const notJson = await failureOf(new Response("<html>błąd</html>", { status: 502 }));
    expect(emptyList.message).toBe("Wystąpił nieoczekiwany błąd.");
    expect(unknownShape.message).toBe("Wystąpił nieoczekiwany błąd.");
    expect(notJson.message).toBe("Wystąpił nieoczekiwany błąd.");
  });

  it("zamienia błąd sieci na ApiError z kodem 0", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    );
    const error: unknown = await api.getArticle(1).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(NETWORK_ERROR_STATUS);
    expect((error as ApiError).message).toBe("Brak połączenia z serwerem. Spróbuj ponownie.");
  });

  it("odrzuca odpowiedź o nieoczekiwanym kształcie jako błąd 502", async () => {
    stubFetch(json({ id: "to-nie-liczba" }));
    const error: unknown = await api.getArticle(1).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(502);
    expect((error as ApiError).message).toBe("Serwer zwrócił nieoczekiwaną odpowiedź.");
  });
});
