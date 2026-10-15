import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { useSummary } from "@/lib/hooks/useSummary";

const stream = vi.hoisted(() => ({ streamSummary: vi.fn() }));
vi.mock("@/lib/ai/streamSummary", () => stream);

function tokens(...parts: string[]) {
  return async function* () {
    for (const part of parts) {
      yield part;
    }
  };
}

describe("useSummary", () => {
  it("zbiera fragmenty w tekst i kończy ze statusem done", async () => {
    stream.streamSummary.mockImplementation(tokens("Ala ", "ma kota."));
    const { result } = renderHook(() => useSummary(3));
    expect(result.current.status).toBe("idle");
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.text).toBe("Ala ma kota.");
    expect(result.current.status).toBe("done");
    expect(stream.streamSummary).toHaveBeenCalledWith(3, expect.any(AbortSignal));
  });

  it("pokazuje komunikat błędu z naszego ApiError", async () => {
    stream.streamSummary.mockImplementation(async function* () {
      yield* [];
      throw new ApiError(502, "Model nie odpowiada.");
    });
    const { result } = renderHook(() => useSummary(3));
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("Model nie odpowiada.");
  });

  it("dla nieznanego rodzaju błędu pokazuje komunikat ogólny", async () => {
    stream.streamSummary.mockImplementation(async function* () {
      yield* [];
      throw "dziwny błąd";
    });
    const { result } = renderHook(() => useSummary(3));
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.error).toBe("Nie udało się wygenerować streszczenia.");
  });

  it("ponowny start przerywa poprzednie generowanie, a jego błąd po przerwaniu jest ignorowany", async () => {
    stream.streamSummary.mockImplementationOnce(async function* (_id: number, signal: AbortSignal) {
      yield* [];
      signal.throwIfAborted();
      await new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(new Error("przerwano")));
      });
    });
    stream.streamSummary.mockImplementationOnce(tokens("nowe"));
    const { result } = renderHook(() => useSummary(3));
    act(() => {
      void result.current.start();
    });
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.status).toBe("done");
    expect(result.current.text).toBe("nowe");
    expect(result.current.error).toBeNull();
  });

  it("spóźniony fragment przerwanego generowania jest porzucany", async () => {
    stream.streamSummary.mockImplementationOnce(async function* () {
      yield "stare";
    });
    stream.streamSummary.mockImplementationOnce(tokens("nowe"));
    const { result } = renderHook(() => useSummary(3));
    act(() => {
      void result.current.start();
    });
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.text).toBe("nowe");
  });

  it("przerywa generowanie przy zamknięciu komponentu", () => {
    let signalSeen: AbortSignal | undefined;
    stream.streamSummary.mockImplementation((_id: number, signal: AbortSignal) => {
      signalSeen = signal;
      return tokens()();
    });
    const { result, unmount } = renderHook(() => useSummary(3));
    act(() => {
      void result.current.start();
    });
    unmount();
    expect(signalSeen?.aborted).toBe(true);
  });
});
