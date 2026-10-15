// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchArticle } from "@/lib/api/server";
import { makeArticle } from "../fixtures";

function stubFetch(response: Response): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(() => Promise.resolve(response));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv("BACKEND_URL", "http://backend.test");
});

describe("fetchArticle", () => {
  it("pobiera artykuł z pełnego adresu backendu i sprawdza jego kształt", async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify(makeArticle({ id: 4 })), { status: 200 }),
    );
    const article = await fetchArticle(4);
    expect(article?.id).toBe(4);
    expect(fetchMock).toHaveBeenCalledWith("http://backend.test/api/articles/4", {
      next: { revalidate: 60 },
    });
  });

  it("zwraca null, gdy backend odpowiada 404", async () => {
    stubFetch(
      new Response(JSON.stringify({ detail: "Nie znaleziono artykułu." }), { status: 404 }),
    );
    expect(await fetchArticle(999)).toBeNull();
  });

  it("zgłasza błąd przy innych kodach niż 200 i 404", async () => {
    stubFetch(new Response("błąd", { status: 500 }));
    await expect(fetchArticle(5)).rejects.toThrow("Backend zwrócił kod 500.");
  });

  it("zgłasza błąd, gdy odpowiedź ma zły kształt", async () => {
    stubFetch(new Response(JSON.stringify({ id: "x" }), { status: 200 }));
    await expect(fetchArticle(6)).rejects.toThrow();
  });

  it("zgłasza błąd, gdy brakuje BACKEND_URL", async () => {
    vi.stubEnv("BACKEND_URL", "");
    await expect(fetchArticle(7)).rejects.toThrow("Brak zmiennej BACKEND_URL.");
  });
});
