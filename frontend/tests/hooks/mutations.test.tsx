import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAddComment } from "@/lib/hooks/useAddComment";
import { useFollow } from "@/lib/hooks/useFollow";
import { useReaction } from "@/lib/hooks/useReaction";
import { queryKeys } from "@/lib/queryKeys";
import { makeArticle, makeComment, makeProfile } from "../fixtures";
import { apiMock } from "../helpers/apiMock";
import { createTestQueryClient, wrapperFor } from "../helpers/render";

describe("useReaction", () => {
  it("dodaje reakcję i wpisuje artykuł z serwera do pamięci podręcznej", async () => {
    const queryClient = createTestQueryClient();
    const updated = makeArticle({ reacted_by_me: true, reactions_count: 3 });
    apiMock.addReaction.mockResolvedValue(updated);
    const { result } = renderHook(() => useReaction(), { wrapper: wrapperFor(queryClient) });
    await act(async () => {
      await result.current.mutateAsync(makeArticle({ reacted_by_me: false }));
    });
    expect(apiMock.addReaction).toHaveBeenCalledWith(1);
    expect(queryClient.getQueryData(queryKeys.article(1))).toEqual(updated);
  });

  it("cofa reakcję, gdy artykuł już ją ma", async () => {
    apiMock.removeReaction.mockResolvedValue(makeArticle({ reacted_by_me: false }));
    const { result } = renderHook(() => useReaction(), {
      wrapper: wrapperFor(createTestQueryClient()),
    });
    await act(async () => {
      await result.current.mutateAsync(makeArticle({ reacted_by_me: true }));
    });
    expect(apiMock.removeReaction).toHaveBeenCalledWith(1);
    expect(apiMock.addReaction).not.toHaveBeenCalled();
  });
});

describe("useFollow", () => {
  it("zaczyna obserwować i zapisuje profil z serwera", async () => {
    const queryClient = createTestQueryClient();
    const updated = makeProfile({ followed_by_me: true, followers_count: 4 });
    apiMock.followUser.mockResolvedValue(updated);
    const { result } = renderHook(() => useFollow(), { wrapper: wrapperFor(queryClient) });
    await act(async () => {
      await result.current.mutateAsync(makeProfile({ followed_by_me: false }));
    });
    expect(apiMock.followUser).toHaveBeenCalledWith(7);
    expect(queryClient.getQueryData(queryKeys.user(7))).toEqual(updated);
  });

  it("przestaje obserwować, gdy już obserwuje", async () => {
    apiMock.unfollowUser.mockResolvedValue(makeProfile({ followed_by_me: false }));
    const { result } = renderHook(() => useFollow(), {
      wrapper: wrapperFor(createTestQueryClient()),
    });
    await act(async () => {
      await result.current.mutateAsync(makeProfile({ followed_by_me: true }));
    });
    expect(apiMock.unfollowUser).toHaveBeenCalledWith(7);
  });
});

describe("useAddComment", () => {
  it("wysyła komentarz i unieważnia dane artykułów", async () => {
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    apiMock.addComment.mockResolvedValue(makeComment());
    const { result } = renderHook(() => useAddComment(5), { wrapper: wrapperFor(queryClient) });
    await act(async () => {
      await result.current.mutateAsync("Hej");
    });
    expect(apiMock.addComment).toHaveBeenCalledWith(5, "Hej");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.articles });
  });
});
