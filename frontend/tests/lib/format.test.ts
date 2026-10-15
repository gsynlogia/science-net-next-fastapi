import { describe, expect, it } from "vitest";
import { formatDate } from "@/lib/format";

describe("formatDate", () => {
  it("formatuje datę po polsku w strefie UTC", () => {
    expect(formatDate("2026-03-01T23:30:00Z")).toBe("1 mar 2026");
  });
});
