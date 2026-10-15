"""Testy asystenta AI z atrapą serwera Ollama (bez prawdziwego modelu)."""

import asyncio
import json
from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager
from typing import Any

import httpx2
from fastapi import status
from fastapi.testclient import TestClient

from app.ai.ollama import get_ollama_client
from app.config import get_settings
from app.main import app
from tests.helpers import publish, register

Handler = Callable[[httpx2.Request], httpx2.Response]


def use_ollama(handler: Handler) -> None:
    """Podłącza atrapę serwera Ollama; fixture `client` sprząta po teście."""

    async def fake_client() -> AsyncIterator[httpx2.AsyncClient]:
        transport = httpx2.MockTransport(handler)
        async with httpx2.AsyncClient(transport=transport, base_url="http://ollama.test") as ollama:
            yield ollama

    app.dependency_overrides[get_ollama_client] = fake_client


def ndjson(*chunks: dict[str, Any]) -> httpx2.Response:
    """Buduje odpowiedź 200 z podanymi fragmentami."""
    body = "".join(json.dumps(chunk) + "\n" for chunk in chunks)
    return httpx2.Response(status.HTTP_200_OK, content=body)


def summarize(client: TestClient, article_id: int, headers: dict[str, str]) -> httpx2.Response:
    """Wysyła żądanie streszczenia i zwraca odpowiedź."""
    return client.post(f"/api/articles/{article_id}/summary", headers=headers)


def test_summary_streams_tokens_as_sse_and_sends_article_to_model(client: TestClient) -> None:
    seen: list[dict[str, Any]] = []

    def handler(request: httpx2.Request) -> httpx2.Response:
        seen.append(json.loads(request.content))
        return ndjson(
            {"response": "Ala ", "done": False},
            {"response": "ma\nkota.", "done": True},
        )

    use_ollama(handler)
    headers = register(client)
    article = publish(client, headers)
    response = summarize(client, article["id"], headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.headers["content-type"].startswith("text/event-stream")
    assert response.text == 'data: "Ala "\n\ndata: "ma\\nkota."\n\n'
    assert seen[0]["model"] == get_settings().ollama_model
    assert seen[0]["stream"] is True
    assert article["title"] in seen[0]["prompt"]


def test_summary_finishes_when_model_stream_ends_without_done_flag(client: TestClient) -> None:
    use_ollama(lambda _request: ndjson({"response": "Fragment"}))
    headers = register(client)
    article = publish(client, headers)
    assert summarize(client, article["id"], headers).text == 'data: "Fragment"\n\n'


def test_summary_reports_error_event_when_model_is_unreachable(client: TestClient) -> None:
    def handler(request: httpx2.Request) -> httpx2.Response:
        raise httpx2.ConnectError("brak połączenia", request=request)

    use_ollama(handler)
    headers = register(client)
    article = publish(client, headers)
    response = summarize(client, article["id"], headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.text.startswith("event: error\ndata: ")
    assert "Traceback" not in response.text and "brak połączenia" not in response.text


def test_summary_reports_error_event_for_http_error_and_garbage(client: TestClient) -> None:
    headers = register(client)
    article = publish(client, headers)
    use_ollama(lambda _request: httpx2.Response(status.HTTP_500_INTERNAL_SERVER_ERROR))
    server_error = summarize(client, article["id"], headers)
    use_ollama(lambda _request: httpx2.Response(status.HTTP_200_OK, content="to nie jest JSON\n"))
    garbage = summarize(client, article["id"], headers)
    assert server_error.text.startswith("event: error")
    assert garbage.text.startswith("event: error")


def test_summary_requires_login(client: TestClient) -> None:
    assert client.post("/api/articles/1/summary").status_code == status.HTTP_401_UNAUTHORIZED


def test_summary_of_missing_article_is_404(client: TestClient) -> None:
    response = summarize(client, 999_999, register(client))
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_ollama_client_points_at_configured_server() -> None:
    async def base_url() -> str:
        async with asynccontextmanager(get_ollama_client)() as ollama:
            return str(ollama.base_url)

    assert asyncio.run(base_url()).rstrip("/") == get_settings().ollama_url.rstrip("/")
