"""Endpoint asystenta AI: streszczenie artykułu lokalnym modelem, wysyłane strumieniem SSE."""

import json
from collections.abc import AsyncIterator
from typing import Annotated

import httpx2
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.ai.ollama import OllamaUnavailableError, get_ollama_client, stream_summary
from app.config import get_settings
from app.dependencies import SessionDep, get_article_or_404, get_current_user

SSE_MEDIA_TYPE = "text/event-stream"
SSE_HEADERS = {"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"}
SUMMARY_FAILED_MESSAGE = "Nie udało się wygenerować streszczenia. Spróbuj ponownie za chwilę."

OllamaClientDep = Annotated[httpx2.AsyncClient, Depends(get_ollama_client)]

router = APIRouter(prefix="/articles", tags=["ai"])


def format_event(data: str, event: str | None = None) -> str:
    """Zwraca ramkę SSE; dane są JSON-em, więc znaki nowego wiersza nie rozbiją ramki."""
    prefix = f"event: {event}\n" if event else ""
    return f"{prefix}data: {json.dumps(data, ensure_ascii=False)}\n\n"


async def summary_events(
    client: httpx2.AsyncClient,
    model: str,
    title: str,
    abstract: str,
) -> AsyncIterator[str]:
    """Oddaje ramki z fragmentami streszczenia; błąd modelu zamienia na ramkę `error`."""
    try:
        async for token in stream_summary(client, model, title, abstract):
            yield format_event(token)
    except OllamaUnavailableError:
        yield format_event(SUMMARY_FAILED_MESSAGE, event="error")


@router.post(
    "/{article_id}/summary",
    summary="Streszczenie artykułu modelem lokalnym (strumień SSE)",
    response_class=StreamingResponse,
    dependencies=[Depends(get_current_user)],
)
def summarize_article(
    article_id: int,
    session: SessionDep,
    client: OllamaClientDep,
) -> StreamingResponse:
    """Strumieniuje streszczenie artykułu; wymaga zalogowania, by anonimy nie obciążały modelu."""
    record = get_article_or_404(session, article_id, viewer_id=None)
    article = record.article
    events = summary_events(client, get_settings().ollama_model, article.title, article.abstract)
    return StreamingResponse(events, media_type=SSE_MEDIA_TYPE, headers=SSE_HEADERS)
