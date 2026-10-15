import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ArticleDetail } from "@/components/ArticleDetail";
import { FeedView } from "@/components/FeedView";
import { UserProfileView } from "@/components/UserProfileView";
import { ApiError } from "@/lib/api/errors";
import { makeArticle, makeProfile } from "../fixtures";
import { apiMock } from "../helpers/apiMock";
import { renderWithClient } from "../helpers/render";

const EMPTY_PAGE = { items: [], next_cursor: null };

describe("FeedView", () => {
  it("pokazuje artykuły, a po wpisaniu frazy i wyborze dziedziny pyta o nie serwer", async () => {
    const user = userEvent.setup();
    apiMock.listArticles.mockResolvedValue({
      items: [makeArticle({ title: "Z tablicy" })],
      next_cursor: null,
    });
    renderWithClient(<FeedView />);
    expect(await screen.findByText("Z tablicy")).toBeInTheDocument();
    expect(apiMock.listArticles).toHaveBeenLastCalledWith({
      cursor: null,
      field: null,
      query: "",
      authorId: null,
    });
    await user.type(screen.getByRole("searchbox", { name: "Szukaj artykułów" }), "ai");
    await waitFor(
      () =>
        expect(apiMock.listArticles).toHaveBeenLastCalledWith({
          cursor: null,
          field: null,
          query: "ai",
          authorId: null,
        }),
      { timeout: 3000 },
    );
    await user.selectOptions(screen.getByLabelText("Dziedzina"), "physics");
    await waitFor(() =>
      expect(apiMock.listArticles).toHaveBeenLastCalledWith({
        cursor: null,
        field: "physics",
        query: "ai",
        authorId: null,
      }),
    );
  });
});

describe("UserProfileView", () => {
  it("pokazuje ładowanie, a potem pełny profil z artykułami autora", async () => {
    apiMock.getUser.mockResolvedValue(makeProfile());
    apiMock.listArticles.mockResolvedValue({
      items: [makeArticle({ title: "Praca Ady" })],
      next_cursor: null,
    });
    renderWithClient(<UserProfileView id={7} />);
    expect(screen.getByText("Ładowanie profilu…")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();
    expect(screen.getByText("Pierwsza programistka.")).toBeInTheDocument();
    expect(screen.getByText("Informatyka")).toBeInTheDocument();
    expect(screen.getByText("Obserwujący: 3")).toBeInTheDocument();
    expect(await screen.findByText("Praca Ady")).toBeInTheDocument();
    expect(apiMock.listArticles).toHaveBeenCalledWith({
      cursor: null,
      field: null,
      query: "",
      authorId: 7,
    });
  });

  it("bez opisu, dziedziny i afiliacji pokazuje napis zastępczy", async () => {
    apiMock.getUser.mockResolvedValue(makeProfile({ bio: null, field: null, affiliation: null }));
    apiMock.listArticles.mockResolvedValue(EMPTY_PAGE);
    renderWithClient(<UserProfileView id={7} />);
    expect(await screen.findByText(/Brak afiliacji/)).toBeInTheDocument();
    expect(screen.queryByText("Pierwsza programistka.")).toBeNull();
    expect(screen.queryByText("Informatyka")).toBeNull();
  });

  it("pokazuje komunikat, gdy profilu nie ma", async () => {
    apiMock.getUser.mockRejectedValue(new ApiError(404, "Nie znaleziono użytkownika."));
    apiMock.listArticles.mockResolvedValue(EMPTY_PAGE);
    renderWithClient(<UserProfileView id={999} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Nie znaleziono użytkownika.");
  });
});

describe("ArticleDetail", () => {
  it("od razu pokazuje artykuł z serwera, a potem podmienia go świeżymi danymi", async () => {
    apiMock.getArticle.mockResolvedValue(makeArticle({ title: "Wersja świeża" }));
    apiMock.listComments.mockResolvedValue(EMPTY_PAGE);
    renderWithClient(
      <ArticleDetail id={1} initialArticle={makeArticle({ title: "Wersja z serwera" })} />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Wersja z serwera");
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Wersja świeża"),
    );
    expect(screen.getByRole("heading", { name: "Komentarze" })).toBeInTheDocument();
    expect(await screen.findAllByRole("link", { name: "Zaloguj się" })).toHaveLength(2);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("gdy odświeżenie się nie uda, zostawia treść i pokazuje komunikat", async () => {
    apiMock.getArticle.mockRejectedValue(new ApiError(500, "Błąd serwera."));
    apiMock.listComments.mockResolvedValue(EMPTY_PAGE);
    renderWithClient(
      <ArticleDetail id={1} initialArticle={makeArticle({ title: "Wersja z serwera" })} />,
    );
    expect(await screen.findByText("Błąd serwera.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Wersja z serwera");
  });
});
