import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ArticleSummary } from "@/components/ArticleSummary";
import { ApiError } from "@/lib/api/errors";
import { renderWithClient, signInAs } from "../helpers/render";

const stream = vi.hoisted(() => ({ streamSummary: vi.fn() }));
vi.mock("@/lib/ai/streamSummary", () => stream);

describe("ArticleSummary", () => {
  it("podczas wczytywania sesji nic nie pokazuje", async () => {
    signInAs();
    const { container } = renderWithClient(<ArticleSummary articleId={3} />);
    expect(container).toBeEmptyDOMElement();
    await screen.findByRole("button", { name: "Streść (AI)" });
  });

  it("gość widzi zaproszenie do logowania", async () => {
    renderWithClient(<ArticleSummary articleId={3} />);
    expect(await screen.findByRole("link", { name: "Zaloguj się" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("po kliknięciu pokazuje streszczenie i zastrzeżenie o modelu AI", async () => {
    const user = userEvent.setup();
    signInAs();
    stream.streamSummary.mockImplementation(async function* () {
      yield "Ala ";
      yield "ma kota.";
    });
    renderWithClient(<ArticleSummary articleId={3} />);
    await user.click(await screen.findByRole("button", { name: "Streść (AI)" }));
    expect(await screen.findByText("Ala ma kota.")).toBeInTheDocument();
    expect(screen.getByText(/lokalny model AI/)).toBeInTheDocument();
    expect(stream.streamSummary).toHaveBeenCalledWith(3, expect.any(AbortSignal));
  });

  it("w trakcie generowania blokuje przycisk i zmienia jego napis", async () => {
    const user = userEvent.setup();
    signInAs();
    stream.streamSummary.mockImplementation(async function* () {
      yield "Początek";
      await new Promise(() => undefined);
    });
    renderWithClient(<ArticleSummary articleId={3} />);
    await user.click(await screen.findByRole("button", { name: "Streść (AI)" }));
    expect(await screen.findByRole("button", { name: "Streszczam…" })).toBeDisabled();
    expect(screen.getByText("Początek")).toBeInTheDocument();
    expect(screen.queryByText(/lokalny model AI/)).toBeNull();
  });

  it("pokazuje komunikat błędu, gdy generowanie się nie uda", async () => {
    const user = userEvent.setup();
    signInAs();
    stream.streamSummary.mockImplementation(async function* () {
      yield* [];
      throw new ApiError(502, "Model nie odpowiada.");
    });
    renderWithClient(<ArticleSummary articleId={3} />);
    await user.click(await screen.findByRole("button", { name: "Streść (AI)" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Model nie odpowiada.");
  });
});
