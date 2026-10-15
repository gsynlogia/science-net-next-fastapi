import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ArticleForm } from "@/components/ArticleForm";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokenStore";
import type { Article, AuthSession } from "@/lib/domain/types";
import { makeArticle, makeCurrentUser } from "../fixtures";
import { apiMock } from "../helpers/apiMock";
import { deferred } from "../helpers/deferred";
import { router } from "../helpers/navigation";
import { renderWithClient, signInAs } from "../helpers/render";

describe("LoginForm", () => {
  it("pusty formularz pokazuje komunikaty walidacji i nic nie wysyła", async () => {
    const user = userEvent.setup();
    renderWithClient(<LoginForm />);
    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));
    expect(await screen.findByText("Podaj poprawny adres e-mail.")).toBeInTheDocument();
    expect(screen.getByText("Podaj hasło.")).toBeInTheDocument();
    expect(apiMock.login).not.toHaveBeenCalled();
  });

  it("poprawne dane logują, zapamiętują token i przenoszą na tablicę", async () => {
    const user = userEvent.setup();
    apiMock.login.mockResolvedValue({ access_token: "nowy-token", token_type: "bearer" });
    apiMock.getMe.mockResolvedValue(makeCurrentUser());
    renderWithClient(<LoginForm />);
    await user.type(screen.getByLabelText("E-mail"), "ada@example.com");
    await user.type(screen.getByLabelText("Hasło"), "Haslo12345!");
    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
    expect(apiMock.login).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "Haslo12345!",
    });
    expect(getAccessToken()).toBe("nowy-token");
  });

  it("pokazuje komunikat z serwera przy złych danych", async () => {
    const user = userEvent.setup();
    apiMock.login.mockRejectedValue(new ApiError(401, "Nieprawidłowy e-mail lub hasło."));
    renderWithClient(<LoginForm />);
    await user.type(screen.getByLabelText("E-mail"), "ada@example.com");
    await user.type(screen.getByLabelText("Hasło"), "zle-haslo");
    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Nieprawidłowy e-mail lub hasło.");
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe("RegisterForm", () => {
  async function fillForm(user: ReturnType<typeof userEvent.setup>, repeat: string) {
    await user.type(screen.getByLabelText("Imię i nazwisko"), "Ada Lovelace");
    await user.type(screen.getByLabelText("E-mail"), "ada@example.com");
    await user.type(screen.getByLabelText("Hasło"), "Haslo12345!");
    await user.type(screen.getByLabelText("Powtórz hasło"), repeat);
    await user.click(screen.getByRole("button", { name: "Załóż konto" }));
  }

  it("różne hasła pokazują błąd przy polu powtórzenia", async () => {
    const user = userEvent.setup();
    renderWithClient(<RegisterForm />);
    await fillForm(user, "inne-haslo");
    expect(await screen.findByText("Hasła nie są takie same.")).toBeInTheDocument();
    expect(apiMock.register).not.toHaveBeenCalled();
  });

  it("poprawne dane zakładają konto bez pola powtórzenia i logują", async () => {
    const user = userEvent.setup();
    apiMock.register.mockResolvedValue({ access_token: "rejestracja-token", token_type: "bearer" });
    apiMock.getMe.mockResolvedValue(makeCurrentUser());
    renderWithClient(<RegisterForm />);
    await fillForm(user, "Haslo12345!");
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
    expect(apiMock.register).toHaveBeenCalledWith({
      full_name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Haslo12345!",
    });
    expect(getAccessToken()).toBe("rejestracja-token");
  });

  it("pokazuje komunikat, gdy e-mail jest już zajęty", async () => {
    const user = userEvent.setup();
    apiMock.register.mockRejectedValue(
      new ApiError(409, "Konto z tym adresem e-mail już istnieje."),
    );
    renderWithClient(<RegisterForm />);
    await fillForm(user, "Haslo12345!");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Konto z tym adresem e-mail już istnieje.",
    );
  });
});

describe("ArticleForm", () => {
  async function fillForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText("Tytuł"), "Nowe odkrycie");
    await user.type(
      screen.getByLabelText("Streszczenie"),
      "Streszczenie liczące więcej niż dwadzieścia znaków.",
    );
    await user.selectOptions(screen.getByLabelText("Dziedzina"), "physics");
    await user.type(screen.getByLabelText("Tagi (oddzielone przecinkami)"), "AI, ml");
    await user.type(
      screen.getByLabelText("Link do pełnego tekstu (opcjonalnie)"),
      "https://example.com/praca.pdf",
    );
    await user.click(screen.getByRole("button", { name: "Opublikuj" }));
  }

  it("podczas wczytywania sesji pokazuje komunikat o ładowaniu", async () => {
    signInAs();
    renderWithClient(<ArticleForm />);
    expect(screen.getByText("Ładowanie…")).toBeInTheDocument();
    await screen.findByRole("button", { name: "Opublikuj" });
  });

  it("gość dostaje prośbę o zalogowanie", async () => {
    renderWithClient(<ArticleForm />);
    expect(await screen.findByRole("link", { name: "zaloguj się" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("pusty formularz pokazuje komunikaty walidacji", async () => {
    const user = userEvent.setup();
    signInAs();
    renderWithClient(<ArticleForm />);
    await user.click(await screen.findByRole("button", { name: "Opublikuj" }));
    expect(await screen.findByText("Tytuł musi mieć co najmniej 5 znaków.")).toBeInTheDocument();
    expect(screen.getByText("Wybierz dziedzinę.")).toBeInTheDocument();
    expect(apiMock.createArticle).not.toHaveBeenCalled();
  });

  it("poprawny formularz publikuje artykuł i przenosi na jego stronę", async () => {
    const user = userEvent.setup();
    signInAs();
    apiMock.createArticle.mockResolvedValue(makeArticle({ id: 42 }));
    renderWithClient(<ArticleForm />);
    await screen.findByRole("button", { name: "Opublikuj" });
    await fillForm(user);
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/articles/42"));
    expect(apiMock.createArticle).toHaveBeenCalledWith({
      title: "Nowe odkrycie",
      abstract: "Streszczenie liczące więcej niż dwadzieścia znaków.",
      field: "physics",
      tags: ["ai", "ml"],
      full_text_url: "https://example.com/praca.pdf",
    });
  });

  it("pokazuje komunikat, gdy serwer odrzuci artykuł", async () => {
    const user = userEvent.setup();
    signInAs();
    apiMock.createArticle.mockRejectedValue(
      new ApiError(422, "Podaj poprawny adres http lub https."),
    );
    renderWithClient(<ArticleForm />);
    await screen.findByRole("button", { name: "Opublikuj" });
    await fillForm(user);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Podaj poprawny adres http lub https.",
    );
  });
});

describe("stan wysyłania formularzy", () => {
  it("logowanie pokazuje „Logowanie…”", async () => {
    const user = userEvent.setup();
    apiMock.login.mockReturnValue(deferred<AuthSession>().promise);
    renderWithClient(<LoginForm />);
    await user.type(screen.getByLabelText("E-mail"), "ada@example.com");
    await user.type(screen.getByLabelText("Hasło"), "Haslo12345!");
    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));
    expect(await screen.findByRole("button", { name: "Logowanie…" })).toBeDisabled();
  });

  it("rejestracja pokazuje „Zakładanie konta…”", async () => {
    const user = userEvent.setup();
    apiMock.register.mockReturnValue(deferred<AuthSession>().promise);
    renderWithClient(<RegisterForm />);
    await user.type(screen.getByLabelText("Imię i nazwisko"), "Ada Lovelace");
    await user.type(screen.getByLabelText("E-mail"), "ada@example.com");
    await user.type(screen.getByLabelText("Hasło"), "Haslo12345!");
    await user.type(screen.getByLabelText("Powtórz hasło"), "Haslo12345!");
    await user.click(screen.getByRole("button", { name: "Załóż konto" }));
    expect(await screen.findByRole("button", { name: "Zakładanie konta…" })).toBeDisabled();
  });

  it("publikacja artykułu pokazuje „Publikowanie…”", async () => {
    const user = userEvent.setup();
    signInAs();
    apiMock.createArticle.mockReturnValue(deferred<Article>().promise);
    renderWithClient(<ArticleForm />);
    await screen.findByRole("button", { name: "Opublikuj" });
    await user.type(screen.getByLabelText("Tytuł"), "Nowe odkrycie");
    await user.type(
      screen.getByLabelText("Streszczenie"),
      "Streszczenie liczące więcej niż dwadzieścia znaków.",
    );
    await user.selectOptions(screen.getByLabelText("Dziedzina"), "physics");
    await user.click(screen.getByRole("button", { name: "Opublikuj" }));
    expect(await screen.findByRole("button", { name: "Publikowanie…" })).toBeDisabled();
  });
});
