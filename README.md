# Science Net — wersja Next.js + FastAPI

**Science Net** to portal społecznościowy dla ludzi nauki: wygląd i mechanika jak w Facebooku (tablica, profile, obserwowanie, reakcje, komentarze),
ale zamiast zdjęć z wakacji publikujemy **artykuły naukowe** — jak w ResearchGate, tyle że w formie mediów społecznościowych.

To repozytorium to **projekt szkoleniowy** „Next-gen development: React i FastAPI – aplikacje fullstack z integracją AI” (Uniwersytet WSB Merito Gdańsk, prowadzący: mgr inż. Szymon Guzik).
Całość powstaje krok po kroku (37 kroków, 30 godzin dydaktycznych); historia commitów odpowiada krokom ze skryptu prowadzącego (jeden commit = jeden krok).
Bliźniacza wersja portalu (Vue 3 + Node.js): `science-net-vue`.

## Funkcje

- **Konto:** rejestracja, logowanie (token JWT, hasła w argon2), wylogowanie.
- **Artykuły:** publikacja (tytuł, streszczenie, dziedzina, tagi, link do pełnego tekstu), strona szczegółów renderowana na serwerze (SEO: tytuł, opis, Open Graph, poprawny kod 404).
- **Tablica:** artykuły od najnowszych, stronicowanie kursorem („Pokaż więcej”), filtr dziedziny, wyszukiwarka po tytule i tagach.
- **Interakcje:** reakcja „Przydatne”, komentarze, profile naukowców i obserwowanie.
- **AI:** „Streść (AI)” — lokalny model językowy (Ollama, `gemma2:2b`) strumieniuje streszczenie do przeglądarki (Server-Sent Events). Bez klucza API i bez opłat.

## Architektura

```
frontend/    Next.js 16 (App Router) + React 19 + TypeScript, Tailwind CSS, TanStack Query
backend/     FastAPI + Pydantic, SQLAlchemy 2 + Alembic, PostgreSQL, JWT (argon2)
docs/        openapi.json — kontrakt API zapisany w repozytorium
docker-compose.yml   baza + model AI (Ollama) + backend + frontend
.github/workflows/   CI: testy backendu i frontendu, e2e, budowanie obrazów
```

Backend: router → repozytorium (SQL tylko w repozytoriach) → model. Schematy Pydantic opisują wejście i wyjście API, a walidacja jest po stronie serwera.
Frontend: komponenty, hooki na logikę, jeden klient API (`HttpApi`) z walidacją odpowiedzi schematem Zod; przeglądarka rozmawia tylko z Next.js (`/api/...` jest przekazywane do backendu).

## Wymagane narzędzia (wersje użyte do przygotowania materiałów)

| Narzędzie | Wersja |
|---|---|
| Node.js | v24.22.0 |
| npm | 11.19.1 |
| Python | 3.13.16 |
| uv (zarządzanie Pythonem i zależnościami) | 0.13.1 |
| Docker / Docker Compose | 29.1.3 / 2.40.3 |
| PostgreSQL (obraz) | `postgres:17.11` |
| Ollama (obraz) | `ollama/ollama:0.40.4`, model `gemma2:2b` |

Najważniejsze pakiety (dokładne wersje: `backend/pyproject.toml` + `backend/uv.lock` oraz `frontend/package.json` + `frontend/package-lock.json`):

| Projekt | Pakiety |
|---|---|
| backend | fastapi 0.143.2, uvicorn 0.54.0, pydantic 2.14.1, sqlalchemy 2.1.4, alembic 1.20.0, psycopg 3.3.6, pyjwt 2.15.1, argon2-cffi 25.1.0, pytest 9.1.1, ruff 0.17.0, mypy 2.4.0 |
| frontend | next 16.4.1, react 19.3.1, typescript 5.9.3, tailwindcss 4.3.3, @tanstack/react-query 5.104.3, react-hook-form 7.90.0, zod 4.6.7, vitest 5.0.4, @playwright/test 1.64.1 |

## Szybki start (Docker)

```bash
cp .env.example .env                           # ustaw własny JWT_SECRET (min. 32 znaki)
docker compose up -d --build --wait            # baza, model AI, backend i frontend
docker compose exec backend python -m app.seed # dane demonstracyjne (jednorazowo)
docker compose exec ollama ollama pull gemma2:2b  # model AI (jednorazowo, ok. 1,6 GB)
```

Aplikacja: <http://localhost:3000>, dokumentacja API: <http://localhost:8000/api/docs>.
Konta demonstracyjne (hasło `Haslo12345!`): `anna@example.com`, `jan@example.com`, `maria@example.com`.

## Uruchomienie lokalne (development)

```bash
docker compose up -d --wait db ollama                 # baza (port 5433) i model AI (port 11434)

# backend (port 8000)
cd backend
cp .env.example .env && uv sync
uv run alembic upgrade head && uv run python -m app.seed
uv run uvicorn app.main:app --reload --port 8000

# frontend (port 3000, proxy /api -> backend)
cd frontend
cp .env.example .env.local && npm ci
npm run dev
```

## Testy i jakość

```bash
cd backend && ./check.sh      # ruff, mypy --strict, pytest z pokryciem 100%
cd frontend && npm run check  # eslint, prettier, tsc, vitest z pokryciem 100%
cd frontend && npm run e2e    # Playwright: scenariusze w przeglądarce (uruchamia serwery sam)
```

Po zmianie API odśwież kontrakt: `cd backend && uv run python -m app.export_openapi` — test sprawdza, czy `docs/openapi.json` jest aktualny.

## Konfiguracja

| Zmienna | Gdzie | Znaczenie |
|---|---|---|
| `DATABASE_URL`, `TEST_DATABASE_URL` | `backend/.env` | adresy bazy aplikacji i bazy testowej (tworzonej automatycznie) |
| `JWT_SECRET`, `JWT_EXPIRE_MINUTES` | `backend/.env`, `.env` | sekret podpisu tokenów (min. 32 znaki) i ich ważność |
| `OLLAMA_URL`, `OLLAMA_MODEL` | `backend/.env` | adres serwera modeli i nazwa modelu |
| `BACKEND_URL` | `frontend/.env.local` | adres backendu, do którego Next.js przekazuje `/api` |

Pliki `.env` nie trafiają do repozytorium — w katalogach są tylko wzory `.env.example`. Wartości w nich to **dane demonstracyjne** (nie używaj ich poza lokalną nauką).

## Bezpieczeństwo

Hasła są zapisywane jako hashe argon2; błędne logowanie nie zdradza, czy konto istnieje; wszystkie dane od klienta są walidowane po stronie serwera (Pydantic), a odpowiedzi serwera po stronie przeglądarki (Zod);
listy są stronicowane z górnym limitem rozmiaru strony; aplikacje w kontenerach działają jako zwykli użytkownicy.

## CI

Przy każdym pushu GitHub Actions uruchamia: testy i kontrolę jakości backendu (z prawdziwym PostgreSQL), kontrolę jakości i build frontendu, testy end-to-end oraz budowanie obrazów Dockera.
