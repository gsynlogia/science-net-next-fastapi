import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken, setAccessToken } from "@/lib/auth/tokenStore";
import { useSession } from "@/lib/auth/useSession";
import { makeCurrentUser } from "../fixtures";
import { apiMock } from "../helpers/apiMock";
import { createTestQueryClient, signInAs, wrapperFor } from "../helpers/render";

function renderSession() {
  const queryClient = createTestQueryClient();
  return { queryClient, ...renderHook(() => useSession(), { wrapper: wrapperFor(queryClient) }) };
}

describe("useSession", () => {
  it("bez tokenu zwraca gościa i nie pyta serwera", async () => {
    const { result } = renderSession();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(apiMock.getMe).not.toHaveBeenCalled();
  });

  it("z tokenem pobiera zalogowanego użytkownika", async () => {
    const user = signInAs(makeCurrentUser({ full_name: "Grace Hopper" }));
    const { result } = renderSession();
    await waitFor(() => expect(result.current.user).toEqual(user));
  });

  it("odrzucony token (401) jest usuwany, a użytkownik staje się gościem", async () => {
    setAccessToken("stary-token");
    apiMock.getMe.mockRejectedValue(new ApiError(401, "Zaloguj się, aby kontynuować."));
    const { result } = renderSession();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it("inny błąd serwera nie usuwa tokenu", async () => {
    setAccessToken("dobry-token");
    apiMock.getMe.mockRejectedValue(new ApiError(500, "Błąd serwera."));
    const { result } = renderSession();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(getAccessToken()).toBe("dobry-token");
  });

  it("signIn zapisuje token i pobiera użytkownika", async () => {
    const { result } = renderSession();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    apiMock.getMe.mockResolvedValue(makeCurrentUser());
    await act(async () => {
      await result.current.signIn("nowy-token");
    });
    expect(getAccessToken()).toBe("nowy-token");
    await waitFor(() => expect(result.current.user?.email).toBe("ada@example.com"));
  });

  it("signOut usuwa token i odświeża widok na gościa", async () => {
    signInAs();
    const { result } = renderSession();
    await waitFor(() => expect(result.current.user).not.toBeNull());
    act(() => result.current.signOut());
    expect(getAccessToken()).toBeNull();
    await waitFor(() => expect(result.current.user).toBeNull());
  });
});
