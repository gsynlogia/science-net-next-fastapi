import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ArticlePage, { generateMetadata } from "@/app/articles/[id]/page";
import NewArticlePage from "@/app/articles/new/page";
import AboutPage, { metadata as aboutMetadata } from "@/app/about/page";
import ErrorPage from "@/app/error";
import RootLayout, { metadata as layoutMetadata } from "@/app/layout";
import LoginPage from "@/app/login/page";
import NotFound from "@/app/not-found";
import HomePage from "@/app/page";
import RegisterPage from "@/app/register/page";
import UserPage from "@/app/users/[id]/page";
import { makeArticle, makeProfile } from "../fixtures";
import { apiMock } from "../helpers/apiMock";
import { NOT_FOUND_ERROR } from "../helpers/navigation";
import { renderWithClient } from "../helpers/render";

const server = vi.hoisted(() => ({ fetchArticle: vi.fn() }));
vi.mock("@/lib/api/server", () => server);

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("strony z prostą treścią", () => {
  it("strona główna pokazuje nagłówek i tablicę", async () => {
    apiMock.listArticles.mockResolvedValue({
      items: [makeArticle({ title: "Na tablicy" })],
      next_cursor: null,
    });
    renderWithClient(<HomePage />);
    expect(screen.getByRole("heading", { name: "Tablica" })).toBeInTheDocument();
    expect(await screen.findByText("Na tablicy")).toBeInTheDocument();
  });

  it("strona „O portalu” ma własny tytuł i opis", () => {
    renderWithClient(<AboutPage />);
    expect(screen.getByRole("heading", { name: "O portalu" })).toBeInTheDocument();
    expect(aboutMetadata.title).toBe("O portalu");
  });

  it("strony logowania i rejestracji odsyłają do siebie nawzajem", () => {
    const { unmount } = renderWithClient(<LoginPage />);
    expect(screen.getByRole("heading", { name: "Logowanie" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Załóż konto" })).toHaveAttribute("href", "/register");
    unmount();
    renderWithClient(<RegisterPage />);
    expect(screen.getByRole("link", { name: "Zaloguj się" })).toHaveAttribute("href", "/login");
  });

  it("strona nowego artykułu zawiera formularz", async () => {
    renderWithClient(<NewArticlePage />);
    expect(screen.getByRole("heading", { name: "Nowy artykuł" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "zaloguj się" })).toBeInTheDocument();
  });

  it("układ strony ustawia język polski, tytuł z szablonem i pasek nawigacji", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <p>Treść strony</p>
      </RootLayout>,
    );
    expect(html).toContain('lang="pl"');
    expect(html).toContain("Treść strony");
    expect(html).toContain("Science Net");
    expect(layoutMetadata.title).toEqual({ default: "Science Net", template: "%s · Science Net" });
  });

  it("strona 404 odsyła na tablicę", () => {
    renderWithClient(<NotFound />);
    expect(screen.getByRole("link", { name: "Wróć na tablicę" })).toHaveAttribute("href", "/");
  });

  it("strona błędu pozwala spróbować ponownie, nie pokazując szczegółów", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    renderWithClient(<ErrorPage error={new Error("tajne szczegóły")} reset={reset} />);
    expect(screen.queryByText(/tajne szczegóły/)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});

describe("strona profilu /users/[id]", () => {
  it("renderuje profil użytkownika z adresu", async () => {
    apiMock.getUser.mockResolvedValue(makeProfile({ full_name: "Grace Hopper" }));
    apiMock.listArticles.mockResolvedValue({ items: [], next_cursor: null });
    renderWithClient(await UserPage(params("7")));
    expect(await screen.findByRole("heading", { name: "Grace Hopper" })).toBeInTheDocument();
    expect(apiMock.getUser).toHaveBeenCalledWith(7);
  });

  it.each(["abc", "0", "-3", "1.5"])("odrzuca zły identyfikator %s stroną 404", async (id) => {
    await expect(UserPage(params(id))).rejects.toThrow(NOT_FOUND_ERROR);
  });
});

describe("strona artykułu /articles/[id]", () => {
  it("renderuje artykuł pobrany na serwerze", async () => {
    const article = makeArticle({ id: 3, title: "Z serwera" });
    server.fetchArticle.mockResolvedValue(article);
    apiMock.getArticle.mockResolvedValue(article);
    apiMock.listComments.mockResolvedValue({ items: [], next_cursor: null });
    renderWithClient(await ArticlePage(params("3")));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Z serwera");
    expect(server.fetchArticle).toHaveBeenCalledWith(3);
  });

  it("buduje metadane: tytuł, opis przycięty do 160 znaków i Open Graph", async () => {
    server.fetchArticle.mockResolvedValue(
      makeArticle({ title: "Tytuł", abstract: "a".repeat(300) }),
    );
    const metadata = await generateMetadata(params("3"));
    expect(metadata.title).toBe("Tytuł");
    expect(metadata.description).toHaveLength(160);
    expect(metadata.openGraph).toMatchObject({ type: "article", authors: ["Ada Lovelace"] });
  });

  it("brak artykułu lub zły identyfikator kończą się stroną 404", async () => {
    server.fetchArticle.mockResolvedValue(null);
    await expect(ArticlePage(params("999"))).rejects.toThrow(NOT_FOUND_ERROR);
    await expect(generateMetadata(params("999"))).rejects.toThrow(NOT_FOUND_ERROR);
    await expect(ArticlePage(params("abc"))).rejects.toThrow(NOT_FOUND_ERROR);
    await expect(ArticlePage(params("0"))).rejects.toThrow(NOT_FOUND_ERROR);
  });
});
