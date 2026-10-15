import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { ArticleCard } from "@/components/ArticleCard";
import { Avatar } from "@/components/Avatar";
import { FeedList } from "@/components/FeedList";
import { FeedResults } from "@/components/FeedResults";
import { Field } from "@/components/Field";
import { FieldBadge } from "@/components/FieldBadge";
import { FieldFilter } from "@/components/FieldFilter";
import { TagList } from "@/components/TagList";
import { makeArticle } from "../fixtures";
import { renderWithClient } from "../helpers/render";

describe("Avatar", () => {
  it("pokazuje inicjały dwóch pierwszych słów imienia", () => {
    const { container } = render(<Avatar name="Ada King Lovelace" />);
    expect(container).toHaveTextContent("AK");
  });

  it("dla jednego słowa pokazuje jedną literę", () => {
    const { container } = render(<Avatar name="platon" />);
    expect(container).toHaveTextContent("P");
  });
});

describe("FieldBadge i TagList", () => {
  it("plakietka pokazuje polską nazwę dziedziny", () => {
    render(<FieldBadge field="computer_science" />);
    expect(screen.getByText("Informatyka")).toBeInTheDocument();
  });

  it("lista tagów pokazuje tagi z krzyżykiem, a dla pustej listy nic", () => {
    const { container, rerender } = render(<TagList tags={["ai", "nlp"]} />);
    expect(screen.getByText("#ai")).toBeInTheDocument();
    expect(screen.getByText("#nlp")).toBeInTheDocument();
    rerender(<TagList tags={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Field", () => {
  it("łączy etykietę z polem i pokazuje błąd tylko gdy jest", () => {
    const { rerender } = render(
      <Field label="Imię">
        <input type="text" />
      </Field>,
    );
    expect(screen.getByLabelText("Imię")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    rerender(
      <Field label="Imię" error="Podaj imię.">
        <input type="text" />
      </Field>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Podaj imię.");
  });
});

describe("FieldFilter", () => {
  it("zgłasza wybraną dziedzinę, a dla „Wszystkie” — null", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FieldFilter value="physics" onChange={onChange} />);
    expect(screen.getByLabelText("Dziedzina")).toHaveValue("physics");
    await user.selectOptions(screen.getByLabelText("Dziedzina"), "biology");
    expect(onChange).toHaveBeenLastCalledWith("biology");
    await user.selectOptions(screen.getByLabelText("Dziedzina"), "Wszystkie");
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("bez wybranej dziedziny pokazuje „Wszystkie”", () => {
    render(<FieldFilter value={null} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Dziedzina")).toHaveValue("");
  });
});

describe("ArticleCard", () => {
  it("na liście: tytuł jest odnośnikiem do artykułu, autor do profilu", () => {
    render(<ArticleCard article={makeArticle({ id: 5 })} />);
    expect(screen.getByRole("link", { name: "Sieci neuronowe w medycynie" })).toHaveAttribute(
      "href",
      "/articles/5",
    );
    expect(screen.getByRole("link", { name: "Ada Lovelace" })).toHaveAttribute("href", "/users/7");
    expect(screen.getByText("Komentarze: 1")).toBeInTheDocument();
    expect(screen.queryByText("Pełny tekst artykułu")).toBeNull();
  });

  it("w szczegółach: tytuł jest nagłówkiem, a pełny tekst odnośnikiem zewnętrznym", () => {
    render(
      <ArticleCard
        article={makeArticle()}
        detailed
        actions={<button type="button">Akcja</button>}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Sieci neuronowe w medycynie",
    );
    expect(screen.getByRole("link", { name: "Pełny tekst artykułu" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    expect(screen.getByRole("button", { name: "Akcja" })).toBeInTheDocument();
  });

  it("bez afiliacji i bez adresu pełnego tekstu pokazuje napis zastępczy", () => {
    const article = makeArticle({
      full_text_url: null,
      author: { id: 7, full_name: "Ada Lovelace", affiliation: null },
    });
    render(<ArticleCard article={article} detailed />);
    expect(screen.getByText(/Brak afiliacji/)).toBeInTheDocument();
    expect(screen.queryByText("Pełny tekst artykułu")).toBeNull();
  });
});

describe("FeedList", () => {
  it("pokazuje kartę z przyciskiem reakcji dla każdego artykułu", () => {
    renderWithClient(
      <FeedList
        articles={[
          makeArticle({ id: 1, title: "Pierwszy" }),
          makeArticle({ id: 2, title: "Drugi" }),
        ]}
      />,
    );
    expect(screen.getByText("Pierwszy")).toBeInTheDocument();
    expect(screen.getByText("Drugi")).toBeInTheDocument();
    expect(screen.getAllByText("Przydatne (2)")).toHaveLength(2);
  });
});

type Feed = ComponentProps<typeof FeedResults>["feed"];

function fakeFeed(overrides: Record<string, unknown>): Feed {
  return {
    isPending: false,
    isError: false,
    isSuccess: true,
    error: null,
    data: {
      pages: [{ items: [makeArticle({ title: "Z listy" })], next_cursor: null }],
      pageParams: [null],
    },
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    ...overrides,
  } as unknown as Feed;
}

describe("FeedResults", () => {
  it("pokazuje ładowanie, błąd i pustą listę", () => {
    const { rerender } = renderWithClient(
      <FeedResults feed={fakeFeed({ isPending: true, isSuccess: false, data: undefined })} />,
    );
    expect(screen.getByText("Ładowanie artykułów…")).toBeInTheDocument();
    rerender(
      <FeedResults
        feed={fakeFeed({
          isError: true,
          isSuccess: false,
          data: undefined,
          error: new Error("Błąd serwera."),
        })}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Błąd serwera.");
    rerender(
      <FeedResults
        feed={fakeFeed({ data: { pages: [{ items: [], next_cursor: null }], pageParams: [null] } })}
      />,
    );
    expect(screen.getByText("Brak artykułów spełniających kryteria.")).toBeInTheDocument();
  });

  it("pokazuje „Pokaż więcej” i dociąga kolejną stronę", async () => {
    const user = userEvent.setup();
    const fetchNextPage = vi.fn();
    const { rerender } = renderWithClient(
      <FeedResults feed={fakeFeed({ hasNextPage: true, fetchNextPage })} />,
    );
    await user.click(screen.getByRole("button", { name: "Pokaż więcej" }));
    expect(fetchNextPage).toHaveBeenCalledOnce();
    rerender(<FeedResults feed={fakeFeed({ hasNextPage: true, isFetchingNextPage: true })} />);
    expect(screen.getByRole("button", { name: "Ładowanie…" })).toBeDisabled();
  });
});
