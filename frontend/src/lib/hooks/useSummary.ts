import { useCallback, useEffect, useRef, useState } from "react";
import { streamSummary } from "@/lib/ai/streamSummary";

type SummaryStatus = "idle" | "streaming" | "done" | "error";
const UNKNOWN_ERROR_MESSAGE = "Nie udało się wygenerować streszczenia.";

export function useSummary(articleId: number) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<SummaryStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const start = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setText("");
    setError(null);
    setStatus("streaming");
    try {
      for await (const token of streamSummary(articleId, current.signal)) {
        if (current.signal.aborted) {
          return;
        }
        setText((previous) => previous + token);
      }
      setStatus("done");
    } catch (caught) {
      if (current.signal.aborted) {
        return;
      }
      setError(caught instanceof Error ? caught.message : UNKNOWN_ERROR_MESSAGE);
      setStatus("error");
    }
  }, [articleId]);

  return { text, status, error, start };
}
