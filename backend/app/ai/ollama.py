"""Klient lokalnego modelu językowego (Ollama): streszczanie artykułu strumieniem fragmentów."""

from collections.abc import AsyncIterator

import httpx2
from pydantic import BaseModel, ValidationError

from app.config import get_settings

GENERATE_PATH = "/api/generate"
UNAVAILABLE_MESSAGE = "Model językowy nie odpowiedział poprawnie."
SUMMARY_PROMPT = (
    "Jesteś asystentem naukowca. Streść po polsku, w dwóch lub trzech zdaniach, "
    "poniższy artykuł. Nie dodawaj informacji, których w nim nie ma.\n\n"
    "Tytuł: {title}\n\nStreszczenie autora: {abstract}"
)


class OllamaUnavailableError(Exception):
    """Nie udało się uzyskać odpowiedzi od modelu językowego."""


class GenerateChunk(BaseModel):
    """Fragment odpowiedzi modelu."""

    response: str = ""
    done: bool = False


async def get_ollama_client() -> AsyncIterator[httpx2.AsyncClient]:
    """Dostarcza klienta skierowanego na skonfigurowany serwer Ollama i zamyka go po odpowiedzi."""
    settings = get_settings()
    async with httpx2.AsyncClient(
        base_url=settings.ollama_url, timeout=settings.ai_timeout_seconds
    ) as client:
        yield client


async def stream_summary(
    client: httpx2.AsyncClient,
    model: str,
    title: str,
    abstract: str,
) -> AsyncIterator[str]:
    """Prosi model o streszczenie i oddaje kolejne fragmenty w miarę ich generowania."""
    payload = {
        "model": model,
        "prompt": SUMMARY_PROMPT.format(title=title, abstract=abstract),
        "stream": True,
    }
    try:
        async with client.stream("POST", GENERATE_PATH, json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                chunk = GenerateChunk.model_validate_json(line)
                yield chunk.response
                if chunk.done:
                    return
    except (httpx2.HTTPError, ValidationError) as error:
        raise OllamaUnavailableError(UNAVAILABLE_MESSAGE) from error
