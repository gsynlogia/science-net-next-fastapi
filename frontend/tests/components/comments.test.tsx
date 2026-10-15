import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CommentForm } from "@/components/CommentForm";
import { CommentsSection } from "@/components/CommentsSection";
import { ApiError } from "@/lib/api/errors";
import type { Comment, Page } from "@/lib/domain/types";
import { makeComment } from "../fixtures";
import { apiMock } from "../helpers/apiMock";
import { deferred } from "../helpers/deferred";
import { renderWithClient, signInAs } from "../helpers/render";

describe("CommentForm", () => {
  it("podczas wczytywania sesji nic nie pokazuje", async () => {
    signInAs();
    const { container } = renderWithClient(<CommentForm articleId={1} />);
    expect(container).toBeEmptyDOMElement();
    await screen.findByRole("button", { name: "Dodaj komentarz" });
  });

  it("gość widzi zaproszenie do logowania zamiast formularza", async () => {
    renderWithClient(<CommentForm articleId={1} />);
    expect(await screen.findByRole("link", { name: "Zaloguj się" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("pusty komentarz pokazuje błąd walidacji i nic nie wysyła", async () => {
    const user = userEvent.setup();
    signInAs();
    renderWithClient(<CommentForm articleId={1} />);
    await user.click(await screen.findByRole("button", { name: "Dodaj komentarz" }));
    expect(await screen.findByText("Napisz komentarz.")).toBeInTheDocument();
    expect(apiMock.addComment).not.toHaveBeenCalled();
  });

  it("poprawny komentarz jest wysyłany, a pole się czyści", async () => {
    const user = userEvent.setup();
    signInAs();
    apiMock.addComment.mockResolvedValue(makeComment());
    apiMock.listComments.mockResolvedValue({ items: [], next_cursor: null });
    renderWithClient(<CommentForm articleId={4} />);
    const field = await screen.findByLabelText("Twój komentarz");
    await user.type(field, "  Świetna praca!  ");
    await user.click(screen.getByRole("button", { name: "Dodaj komentarz" }));
    await waitFor(() => expect(apiMock.addComment).toHaveBeenCalledWith(4, "Świetna praca!"));
    await waitFor(() => expect(field).toHaveValue(""));
  });

  it("pokazuje komunikat, gdy serwer odrzuci komentarz", async () => {
    const user = userEvent.setup();
    signInAs();
    apiMock.addComment.mockRejectedValue(new ApiError(404, "Nie znaleziono artykułu."));
    renderWithClient(<CommentForm articleId={4} />);
    await user.type(await screen.findByLabelText("Twój komentarz"), "Hej");
    await user.click(screen.getByRole("button", { name: "Dodaj komentarz" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Nie znaleziono artykułu.");
  });
});

describe("CommentsSection", () => {
  it("pokazuje ładowanie, potem komunikat o braku komentarzy", async () => {
    apiMock.listComments.mockResolvedValue({ items: [], next_cursor: null });
    renderWithClient(<CommentsSection articleId={1} />);
    expect(screen.getByText("Ładowanie komentarzy…")).toBeInTheDocument();
    expect(await screen.findByText(/Nie ma jeszcze komentarzy/)).toBeInTheDocument();
  });

  it("pokazuje komunikat o błędzie pobierania", async () => {
    apiMock.listComments.mockRejectedValue(new ApiError(500, "Błąd serwera."));
    renderWithClient(<CommentsSection articleId={1} />);
    expect(await screen.findByText("Błąd serwera.")).toBeInTheDocument();
  });

  it("pokazuje komentarze z odnośnikiem do autora i dociąga kolejną stronę", async () => {
    const user = userEvent.setup();
    apiMock.listComments
      .mockResolvedValueOnce({
        items: [makeComment({ id: 1, body: "Pierwszy" })],
        next_cursor: "1",
      })
      .mockResolvedValueOnce({ items: [makeComment({ id: 2, body: "Drugi" })], next_cursor: null });
    renderWithClient(<CommentsSection articleId={1} />);
    expect(await screen.findByText("Pierwszy")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Jan Nowak" })).toHaveAttribute("href", "/users/8");
    await user.click(screen.getByRole("button", { name: "Pokaż więcej komentarzy" }));
    expect(await screen.findByText("Drugi")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pokaż więcej komentarzy" })).toBeNull();
  });
});

describe("stany oczekiwania w komentarzach", () => {
  it("formularz pokazuje „Wysyłanie…”, dopóki serwer nie odpowie", async () => {
    const user = userEvent.setup();
    signInAs();
    apiMock.addComment.mockReturnValue(deferred<Comment>().promise);
    renderWithClient(<CommentForm articleId={1} />);
    await user.type(await screen.findByLabelText("Twój komentarz"), "Hej");
    await user.click(screen.getByRole("button", { name: "Dodaj komentarz" }));
    expect(await screen.findByRole("button", { name: "Wysyłanie…" })).toBeDisabled();
  });

  it("przycisk „Pokaż więcej komentarzy” pokazuje „Ładowanie…” podczas dociągania", async () => {
    const user = userEvent.setup();
    apiMock.listComments
      .mockResolvedValueOnce({ items: [makeComment({ id: 1 })], next_cursor: "1" })
      .mockReturnValueOnce(deferred<Page<Comment>>().promise);
    renderWithClient(<CommentsSection articleId={1} />);
    await user.click(await screen.findByRole("button", { name: "Pokaż więcej komentarzy" }));
    expect(await screen.findByRole("button", { name: "Ładowanie…" })).toBeDisabled();
  });
});
