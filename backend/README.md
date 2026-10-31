# TrustScan API

FastAPI service for the TrustScan AI digital-trust investigation platform.

## Run locally

```bash
cd backend
uv venv
uv pip install -e ".[dev]"
cp ../.env.example ../.env
uv run uvicorn app.main:app --reload --port 8000
```

The API docs are available at `http://localhost:8000/docs`.

## Tests

```bash
uv run pytest
```
