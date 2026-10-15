import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { streamSummary } from "@/lib/ai/streamSummary";

function sseResponse(chunks: string[], status = 200): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(body, { status });
}

async function collect(response: Response): Promise<string[]> {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(response)),
  );
  const tokens: string[] = [];
  for await (const token of streamSummary(1, new AbortController().signal)) {
    tokens.push(token);
  }
  return tokens;
}

describe("streamSummary", () => {
  it("oddaje kolejne fragmenty z ramek SSE", async () => {
    const tokens = await collect(sseResponse(['data: "Ala "\n\ndata: "ma kota."\n\n']));
    expect(tokens).toEqual(["Ala ", "ma kota."]);
  });

  it("składa ramkę rozciętą między kawałkami sieci", async () => {
    const tokens = await collect(sseResponse(['data: "A', 'la"\n', '\ndata: "ma"\n\n']));
    expect(tokens).toEqual(["Ala", "ma"]);
  });

  it("ignoruje wiersze, które nie są ani zdarzeniem, ani danymi", async () => {
    const tokens = await collect(sseResponse([': ping\ndata: "x"\n\n']));
    expect(tokens).toEqual(["x"]);
  });

  it("zamienia ramkę error na ApiError z komunikatem serwera", async () => {
    const response = sseResponse([
      'data: "Początek"\n\nevent: error\ndata: "Model nie odpowiada."\n\n',
    ]);
    await expect(collect(response)).rejects.toThrow(new ApiError(502, "Model nie odpowiada."));
  });

  it("odrzuca ramkę, która nie jest tekstem w JSON-ie", async () => {
    await expect(collect(sseResponse(["data: nie-json\n\n"]))).rejects.toThrow(
      "nieczytelny fragment",
    );
    await expect(collect(sseResponse(["data: 5\n\n"]))).rejects.toThrow("nieczytelny fragment");
  });

  it("zgłasza błąd, gdy odpowiedź nie ma treści", async () => {
    await expect(collect(new Response(null, { status: 200 }))).rejects.toThrow(
      "Serwer nie przesłał streszczenia.",
    );
  });

  it("zgłasza błąd serwera przed rozpoczęciem strumienia", async () => {
    const response = new Response(JSON.stringify({ detail: "Zaloguj się, aby kontynuować." }), {
      status: 401,
    });
    await expect(collect(response)).rejects.toThrow("Zaloguj się, aby kontynuować.");
  });

  it("zamyka połączenie, gdy odbiorca przestaje czytać", async () => {
    const cancelled = vi.fn();
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: "pierwszy"\n\n'));
      },
      cancel: cancelled,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(body))),
    );
    const generator = streamSummary(1, new AbortController().signal);
    expect((await generator.next()).value).toBe("pierwszy");
    await generator.return(undefined);
    expect(cancelled).toHaveBeenCalledOnce();
  });
});
