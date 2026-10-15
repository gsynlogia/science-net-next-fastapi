import { useQueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Providers } from "@/components/Providers";

function Probe() {
  const options = useQueryClient().getDefaultOptions().queries;
  return <p>{`staleTime=${options?.staleTime}; retry=${options?.retry}`}</p>;
}

describe("Providers", () => {
  it("udostępnia dzieciom pamięć podręczną z 30-sekundową świeżością i bez powtórzeń", () => {
    render(
      <Providers>
        <Probe />
      </Providers>,
    );
    expect(screen.getByText("staleTime=30000; retry=false")).toBeInTheDocument();
  });
});
