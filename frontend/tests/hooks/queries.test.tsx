import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useArticle } from "@/lib/hooks/useArticle";
import { useComments } from "@/lib/hooks/useComments";
import { useFeed } from "@/lib/hooks/useFeed";
import { useUser } from "@/lib/hooks/useUser";
import { makeArticle, makeComment, makeProfile } from "../fixtures";
import { apiMock } from "../helpers/apiMock";
import { createTestQueryClient, wrapperFor } from "../helpers/render";

describe("useFeed", () => {
  it("pobiera strony kursorem i przekazuje filtry do API", async () => {
    const first = makeArticle({ id: 2 });
    const second = makeArticle({ id: 1 });
    apiMock.listArticles
      .mockResolvedValueOnce({ items: [first], next_cursor: "2" })
      .mockResolvedValueOnce({ items: [second], next_cursor: null });
    const { result } = renderHook(() => useFeed("physics", "ai", 3), {
      wrapper: wrapperFor(createTestQueryClient()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiMock.listArticles).toHaveBeenCalledWith({
      cursor: null,
      field: "physics",
      query: "ai",
      authorId: 3,
    });
    let outcome: Awaited<ReturnType<typeof result.current.fetchNextPage>> | undefined;
    await act(async () => {
      outcome = await result.current.fetchNextPage();
    });
    expect(apiMock.listArticles).toHaveBeenLastCalledWith({
      cursor: "2",
      field: "physics",
      query: "ai",
      authorId: 3,
    });
    expect(outcome?.hasNextPage).toBe(false);
    expect(outcome?.data?.pages).toHaveLength(2);
  });

  it("bez filtra autora pyta o wszystkich autorów", async () => {
    apiMock.listArticles.mockResolvedValue({ items: [], next_cursor: null });
    const { result } = renderHook(() => useFeed(null, ""), {
      wrapper: wrapperFor(createTestQueryClient()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiMock.listArticles).toHaveBeenCalledWith({
      cursor: null,
      field: null,
      query: "",
      authorId: null,
    });
  });
});

describe("useArticle", () => {
  it("zaczyna od artykułu z serwera i podmienia go świeżymi danymi", async () => {
    const fromServer = makeArticle({ reacted_by_me: false });
    const fresh = makeArticle({ reacted_by_me: true });
    apiMock.getArticle.mockResolvedValue(fresh);
    const { result } = renderHook(() => useArticle(fromServer.id, fromServer), {
      wrapper: wrapperFor(createTestQueryClient()),
    });
    expect(result.current.data).toEqual(fromServer);
    await waitFor(() => expect(result.current.data).toEqual(fresh));
  });
});

describe("useComments", () => {
  it("pobiera komentarze wskazanego artykułu", async () => {
    apiMock.listComments.mockResolvedValue({ items: [makeComment()], next_cursor: null });
    const { result } = renderHook(() => useComments(4), {
      wrapper: wrapperFor(createTestQueryClient()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiMock.listComments).toHaveBeenCalledWith({ articleId: 4, cursor: null });
    expect(result.current.data?.pages[0]?.items[0]?.body).toBe("Ciekawa praca!");
  });
});

describe("useUser", () => {
  it("pobiera profil użytkownika", async () => {
    apiMock.getUser.mockResolvedValue(makeProfile({ full_name: "Grace Hopper" }));
    const { result } = renderHook(() => useUser(7), {
      wrapper: wrapperFor(createTestQueryClient()),
    });
    await waitFor(() => expect(result.current.data?.full_name).toBe("Grace Hopper"));
    expect(apiMock.getUser).toHaveBeenCalledWith(7);
  });
});
