import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Navbar } from "@/components/Navbar";
import { getAccessToken } from "@/lib/auth/tokenStore";
import { makeCurrentUser } from "../fixtures";
import { setPathname } from "../helpers/navigation";
import { renderWithClient, signInAs } from "../helpers/render";

describe("Navbar", () => {
  it("gość widzi odnośniki do logowania i rejestracji, a bieżąca strona jest wyróżniona", async () => {
    setPathname("/about");
    renderWithClient(<Navbar />);
    expect(await screen.findByRole("link", { name: "Zaloguj się" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Załóż konto" })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: "O portalu" })).toHaveClass("font-semibold");
    expect(screen.getByRole("link", { name: "Tablica" })).not.toHaveClass("font-semibold");
  });

  it("w trakcie wczytywania sesji nie pokazuje menu użytkownika", async () => {
    signInAs();
    renderWithClient(<Navbar />);
    expect(screen.queryByRole("link", { name: "Zaloguj się" })).toBeNull();
    expect(await screen.findByRole("link", { name: "Ada Lovelace" })).toBeInTheDocument();
  });

  it("zalogowany widzi swoje imię, link do nowego artykułu i może się wylogować", async () => {
    const user = userEvent.setup();
    signInAs(makeCurrentUser({ id: 9, full_name: "Grace Hopper" }));
    renderWithClient(<Navbar />);
    expect(await screen.findByRole("link", { name: "Grace Hopper" })).toHaveAttribute(
      "href",
      "/users/9",
    );
    expect(screen.getByRole("link", { name: "Nowy artykuł" })).toHaveAttribute(
      "href",
      "/articles/new",
    );
    await user.click(screen.getByRole("button", { name: "Wyloguj" }));
    expect(await screen.findByRole("link", { name: "Zaloguj się" })).toBeInTheDocument();
    expect(getAccessToken()).toBeNull();
  });
});
