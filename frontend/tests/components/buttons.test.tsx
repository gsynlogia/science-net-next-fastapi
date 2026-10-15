import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FollowButton } from "@/components/FollowButton";
import { ReactionButton } from "@/components/ReactionButton";
import { ApiError } from "@/lib/api/errors";
import type { Article, UserProfile } from "@/lib/domain/types";
import { makeArticle, makeCurrentUser, makeProfile } from "../fixtures";
import { apiMock } from "../helpers/apiMock";
import { deferred } from "../helpers/deferred";
import { renderWithClient, signInAs } from "../helpers/render";

describe("ReactionButton", () => {
  it("podczas wczytywania sesji pokazuje sam licznik bez możliwości kliknięcia", async () => {
    signInAs();
    renderWithClient(<ReactionButton article={makeArticle()} />);
    expect(screen.getByText("Przydatne (2)")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
    expect(await screen.findByRole("button", { name: "Przydatne (2)" })).toBeInTheDocument();
  });

  it("gość widzi odnośnik do logowania", async () => {
    renderWithClient(<ReactionButton article={makeArticle()} />);
    expect(await screen.findByRole("link", { name: "Przydatne (2)" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("zalogowany: kliknięcie dodaje reakcję, a stan wciśnięty zależy od artykułu", async () => {
    const user = userEvent.setup();
    signInAs();
    apiMock.addReaction.mockResolvedValue(makeArticle({ reacted_by_me: true, reactions_count: 3 }));
    renderWithClient(<ReactionButton article={makeArticle()} />);
    const button = await screen.findByRole("button", { name: "Przydatne (2)" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await user.click(button);
    expect(apiMock.addReaction).toHaveBeenCalledWith(1);
  });

  it("artykuł z reakcją ma wciśnięty przycisk i kliknięcie ją cofa", async () => {
    const user = userEvent.setup();
    signInAs();
    apiMock.removeReaction.mockResolvedValue(makeArticle());
    renderWithClient(<ReactionButton article={makeArticle({ reacted_by_me: true })} />);
    const button = await screen.findByRole("button", { name: "Przydatne (2)" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    await user.click(button);
    expect(apiMock.removeReaction).toHaveBeenCalledWith(1);
  });

  it("pokazuje komunikat, gdy zapis się nie uda", async () => {
    const user = userEvent.setup();
    signInAs();
    apiMock.addReaction.mockRejectedValue(new ApiError(500, "Błąd serwera."));
    renderWithClient(<ReactionButton article={makeArticle()} />);
    await user.click(await screen.findByRole("button", { name: "Przydatne (2)" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Błąd serwera.");
  });

  it("blokuje przycisk, dopóki trwa wysyłanie", async () => {
    const user = userEvent.setup();
    signInAs();
    const pending = deferred<Article>();
    apiMock.addReaction.mockReturnValue(pending.promise);
    renderWithClient(<ReactionButton article={makeArticle()} />);
    const button = await screen.findByRole("button", { name: "Przydatne (2)" });
    await user.click(button);
    await waitFor(() => expect(button).toBeDisabled());
    await act(async () => {
      pending.resolve(makeArticle({ reacted_by_me: true }));
    });
    await waitFor(() => expect(button).toBeEnabled());
  });
});

describe("FollowButton", () => {
  const profile = (overrides: Partial<UserProfile> = {}) => makeProfile({ id: 7, ...overrides });

  it("nie pokazuje nic na własnym profilu ani podczas wczytywania sesji", async () => {
    signInAs(makeCurrentUser({ id: 7 }));
    const { container } = renderWithClient(<FollowButton profile={profile()} />);
    expect(container).toBeEmptyDOMElement();
    await waitFor(() => expect(apiMock.getMe).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("gość widzi zaproszenie do logowania", async () => {
    renderWithClient(<FollowButton profile={profile()} />);
    expect(
      await screen.findByRole("link", { name: "Zaloguj się, aby obserwować" }),
    ).toHaveAttribute("href", "/login");
  });

  it("zalogowany: „Obserwuj” zaczyna obserwowanie", async () => {
    const user = userEvent.setup();
    signInAs(makeCurrentUser({ id: 8 }));
    apiMock.followUser.mockResolvedValue(profile({ followed_by_me: true }));
    renderWithClient(<FollowButton profile={profile()} />);
    await user.click(await screen.findByRole("button", { name: "Obserwuj" }));
    expect(apiMock.followUser).toHaveBeenCalledWith(7);
  });

  it("zalogowany: „Przestań obserwować” kończy obserwowanie", async () => {
    const user = userEvent.setup();
    signInAs(makeCurrentUser({ id: 8 }));
    apiMock.unfollowUser.mockResolvedValue(profile());
    renderWithClient(<FollowButton profile={profile({ followed_by_me: true })} />);
    const button = await screen.findByRole("button", { name: "Przestań obserwować" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    await user.click(button);
    expect(apiMock.unfollowUser).toHaveBeenCalledWith(7);
  });

  it("pokazuje komunikat, gdy zmiana się nie uda", async () => {
    const user = userEvent.setup();
    signInAs(makeCurrentUser({ id: 8 }));
    apiMock.followUser.mockRejectedValue(new ApiError(404, "Nie znaleziono użytkownika."));
    renderWithClient(<FollowButton profile={profile()} />);
    await user.click(await screen.findByRole("button", { name: "Obserwuj" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Nie znaleziono użytkownika.");
  });
});
