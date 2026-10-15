import { z } from "zod";
import { ApiError, HttpStatus } from "@/lib/api/errors";
import { send } from "@/lib/api/http";

const FRAME_SEPARATOR = "\n\n";
const EVENT_PREFIX = "event: ";
const DATA_PREFIX = "data: ";
const ERROR_EVENT = "error";
const EMPTY_STREAM_MESSAGE = "Serwer nie przesłał streszczenia.";
const BAD_FRAME_MESSAGE = "Serwer przesłał nieczytelny fragment streszczenia.";

const dataSchema = z.string();

interface Frame {
  event: string | null;
  text: string;
}

function parseFrame(frame: string): Frame {
  let event: string | null = null;
  let data = "";
  for (const line of frame.split("\n")) {
    if (line.startsWith(EVENT_PREFIX)) {
      event = line.slice(EVENT_PREFIX.length);
    } else if (line.startsWith(DATA_PREFIX)) {
      data = line.slice(DATA_PREFIX.length);
    }
  }
  try {
    return { event, text: dataSchema.parse(JSON.parse(data)) };
  } catch {
    throw new ApiError(HttpStatus.BadGateway, BAD_FRAME_MESSAGE);
  }
}

export async function* streamSummary(
  articleId: number,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const response = await send(`/articles/${articleId}/summary`, { method: "POST", signal });
  if (response.body === null) {
    throw new ApiError(HttpStatus.BadGateway, EMPTY_STREAM_MESSAGE);
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      buffer += value;
      const frames = buffer.split(FRAME_SEPARATOR);
      buffer = frames.pop() as string;
      for (const frame of frames) {
        const { event, text } = parseFrame(frame);
        if (event === ERROR_EVENT) {
          throw new ApiError(HttpStatus.BadGateway, text);
        }
        yield text;
      }
    }
  } finally {
    await reader.cancel();
  }
}
