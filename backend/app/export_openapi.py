"""Eksport schematu OpenAPI do pliku `docs/openapi.json` — kontrakt API zapisany w repozytorium."""

import json
from pathlib import Path

from app.main import app

OUTPUT_PATH = Path(__file__).resolve().parents[2] / "docs" / "openapi.json"


def build_schema_text() -> str:
    """Zwraca schemat OpenAPI jako czytelny, stabilnie uporządkowany JSON."""
    return json.dumps(app.openapi(), indent=2, ensure_ascii=False, sort_keys=True) + "\n"


if __name__ == "__main__":
    OUTPUT_PATH.parent.mkdir(exist_ok=True)
    OUTPUT_PATH.write_text(build_schema_text(), encoding="utf-8")
    print(f"Zapisano {OUTPUT_PATH}")
