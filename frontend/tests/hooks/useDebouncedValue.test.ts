import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

const DELAY_MS = 400;

describe("useDebouncedValue", () => {
  it("zwraca nową wartość dopiero po upływie opóźnienia", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, DELAY_MS), {
      initialProps: { value: "a" },
    });
    rerender({ value: "b" });
    act(() => vi.advanceTimersByTime(DELAY_MS - 1));
    expect(result.current).toBe("a");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("b");
  });

  it("kolejna zmiana przed upływem opóźnienia zaczyna odliczanie od nowa", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, DELAY_MS), {
      initialProps: { value: "a" },
    });
    rerender({ value: "b" });
    act(() => vi.advanceTimersByTime(DELAY_MS - 1));
    rerender({ value: "c" });
    act(() => vi.advanceTimersByTime(DELAY_MS - 1));
    expect(result.current).toBe("a");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("c");
  });
});
