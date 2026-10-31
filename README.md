# TrustScan AI

**Verify before you trust.**

TrustScan AI is an evidence-grounded fraud and digital-trust investigation platform. It takes a
suspicious message, URL, screenshot or document, extracts observable evidence, retrieves trusted
guidance, correlates independent signals, and produces an explainable risk verdict with concrete
next steps.

It runs fully **without an LLM API key**: a deterministic analysis engine keeps every feature
usable for demos, offline testing and evaluation.

---

## Table of contents

- [What it does](#what-it-does)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Quick start (Docker)](#quick-start-docker)
- [Local development](#local-development)
- [Configuration](#configuration)
- [Investigation pipeline](#investigation-pipeline)
- [Risk model](#risk-model)
- [API surface](#api-surface)
- [Testing](#testing)
- [Production checklist](#production-checklist)
- [Legacy Streamlit MVP](#legacy-streamlit-mvp)
- [Disclaimer](#disclaimer)

---

## What it does

| Capability | Detail |
| --- | --- |
| **Multimodal intake** | Free-text message, URL, screenshot (OCR) or document (PDF/TXT/MD/CSV). |
| **Evidence extraction** | URLs, phone numbers, emails, money amounts, organizations, requests, risk indicators. |
| **URL intelligence** | Structure analysis, look-alike brand domains, shorteners, punycode, `@`-obfuscation, suspicious keywords. |
| **Trusted-source RAG** | Retrieval over a curated cybersecurity knowledge base with pgvector (or SQLite fallback). |
| **Generative investigation** | Structured analysis of threat category, intent, entities, claims and risk signals. |
| **Evidence correlation** | Independent signals are linked into named patterns instead of being scored in isolation. |
| **Explainable risk scoring** | A deterministic 0–100 engine with bounded bands and a written justification. |
| **Protection guidance** | Ranked, practical actions rather than a bare label. |
| **Auditability** | Every pipeline stage is persisted with status, timing and detail. |

Unknown senders are never treated as automatically fraudulent, and the absence of reports is not
presented as proof of safety.

---

## Architecture

```text
┌──────────────────────────────┐        ┌──────────────────────────────────────────┐
│  Next.js 16 / React 19       │        │  FastAPI (Python 3.14, async)            │
│  App Router · Tailwind 4     │  HTTP  │                                          │
│  TanStack Query · Radix UI   │ ─────► │  Auth (JWT + rotating refresh cookie)    │
│  TypeScript · Zod            │  JSON  │  Investigations · Analytics · Knowledge  │
└──────────────────────────────┘        │                                          │
                                        │  8-stage investigation pipeline          │
                                        │    intake → extraction → URL intel       │
                                        │    → RAG → GenAI → correlation           │
                                        │    → risk → guidance                     │
                                        └───────────────┬──────────────────────────┘
                                                        │ SQLAlchemy 2.1 (async)
                                        ┌───────────────▼──────────────────────────┐
                                        │  PostgreSQL 18 + pgvector                │
                                        │  users · sessions · investigations       │
                                        │  knowledge documents/chunks (embeddings) │
                                        └──────────────────────────────────────────┘
```

- **Backend** — layered FastAPI app: `api` (routers) → `services` (domain logic) → `models`
  (SQLAlchemy) with `schemas` for I/O contracts.
- **Frontend** — server-rendered Next.js App Router with a protected application shell; all data
  access goes through a typed fetch client with automatic access-token refresh.
- **Database** — PostgreSQL 18 with the `vector` extension for embeddings. SQLite works for tests
  and zero-dependency demos; vector search then falls back to in-process cosine similarity.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 16.4, React 19.3, TypeScript 5.9, Tailwind CSS 4.3 |
| UI | Radix UI primitives, lucide-react, sonner, custom design system |
| Data fetching | TanStack Query 5, native `fetch` client with 401 refresh-retry |
| Forms & validation | react-hook-form + Zod 4 |
| Backend | FastAPI 0.162, Python 3.14, Pydantic 2.14 |
| ORM & migrations | SQLAlchemy 2.1 (async), Alembic |
| Database | PostgreSQL 18 + pgvector (SQLite + aiosqlite fallback) |
| Auth | Argon2 (`pwdlib`), short-lived JWT access tokens, httpOnly refresh cookie |
| RAG | pgvector / cosine fallback, `openai`, `sentence-transformers` or deterministic `hash` embeddings |
| LLM | OpenAI-compatible client (OpenRouter by default) with heuristic fallback |
| Extraction | PyMuPDF, Pillow, pytesseract |
| Observability | structlog (JSON in containers), request IDs, health/readiness probes |
| Delivery | Docker multi-stage builds, Docker Compose, GitHub Actions CI |

---

## Repository layout

```text
trustscan-ai/
├── backend/                 FastAPI service
│   ├── app/
│   │   ├── api/             auth, investigations, analytics, knowledge, system
│   │   ├── core/            config, database, security, logging, rate limiting, errors
│   │   ├── models/          SQLAlchemy models
│   │   ├── schemas/         Pydantic contracts
│   │   └── services/        pipeline, extraction, URL intel, RAG, LLM, risk, actions
│   ├── migrations/          Alembic environment + initial schema
│   ├── scripts/             seed_knowledge, seed_demo, cleanup
│   ├── tests/               pytest suite (API + domain)
│   ├── Dockerfile
│   └── pyproject.toml / uv.lock
├── frontend/                Next.js application
│   ├── src/app/             routes: landing, auth, dashboard, investigate, report…
│   ├── src/components/      UI primitives, layout, report visualisations
│   ├── src/lib/             API client, auth context, types, utilities
│   └── Dockerfile
├── data/
│   ├── knowledge_base/      Trusted cybersecurity guidance (RAG corpus)
│   └── test_cases/          20-case evaluation dataset
├── docs/ARCHITECTURE.md     Deeper design notes
├── legacy/streamlit/        Original Streamlit MVP (preserved)
├── docker-compose.yml
├── Makefile
└── .env.example
```

---

## Quick start (Docker)

Requirements: Docker Desktop (or Docker Engine + Compose v2).

```bash
cp .env.example .env
# Set a real secret:
#   python -c "import secrets; print(secrets.token_urlsafe(48))"

docker compose up --build -d
docker compose ps
```

| Service | URL |
| --- | --- |
| Web app | http://localhost:3000 |
| API | http://localhost:8000 |
| OpenAPI docs | http://localhost:8000/docs |
| Health | http://localhost:8000/health |

The API container applies Alembic migrations on start, seeds the knowledge base, and then serves
traffic. Create an account at `/register`, or seed a demo workspace:

```bash
docker compose exec api python -m scripts.seed_demo
# demo@trustscan.ai / TrustScanDemo123
```

Stop with `docker compose down` (add `-v` to delete the database and uploads).

> The bundled Compose file defaults to `TRUSTSCAN_ENVIRONMENT=development` so refresh cookies work
> over plain HTTP on localhost. For a real deployment set `TRUSTSCAN_ENVIRONMENT=production` and
> terminate TLS in front of the stack; cookies become `Secure` automatically.

---

## Local development

Requirements: Python 3.12+ (3.14 recommended), [uv](https://docs.astral.sh/uv/), Node 22+.

```bash
# 1. Environment
cp .env.example .env
# Point TRUSTSCAN_DATABASE_URL at PostgreSQL, or use SQLite for a quick run:
#   TRUSTSCAN_DATABASE_URL=sqlite+aiosqlite:///./trustscan.db

# 2. Backend
cd backend
uv sync --extra dev
uv run alembic upgrade head        # skip when AUTO_CREATE_TABLES=true
uv run uvicorn app.main:app --reload --port 8000

# 3. Frontend (new terminal)
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Frontend expects `NEXT_PUBLIC_API_URL=http://localhost:8000`; the backend allows
`http://localhost:3000` and `http://127.0.0.1:3000` with credentials.

Useful `make` targets: `install`, `dev-api`, `dev-web`, `test`, `lint`, `typecheck`, `build`,
`up`, `down`, `logs`, `migrate`, `seed`, `cleanup`, `reset`.

---

## Configuration

All backend settings use the `TRUSTSCAN_` prefix and are validated by Pydantic. See
[`.env.example`](.env.example) for the full annotated list. The settings that matter most:

| Variable | Default | Purpose |
| --- | --- | --- |
| `TRUSTSCAN_ENVIRONMENT` | `development` | `development` / `test` / `production`; production enforces secure cookies and no debug. |
| `TRUSTSCAN_SECRET_KEY` | random per process | JWT signing key — **must** be stable and secret in production. |
| `TRUSTSCAN_DATABASE_URL` | PostgreSQL URL | `postgresql+asyncpg://…` or `sqlite+aiosqlite:///…`. |
| `TRUSTSCAN_CORS_ORIGINS` | localhost:3000 | Comma-separated allowed origins. |
| `TRUSTSCAN_LLM_API_KEY` | empty | Empty ⇒ deterministic fallback engine. |
| `TRUSTSCAN_EMBEDDING_PROVIDER` | `hash` | `openai`, `sentence-transformers` or `hash`. |
| `TRUSTSCAN_PIPELINE_MODE` | `background` | `inline` runs the pipeline inside the request (tests/demos). |
| `TRUSTSCAN_OCR_ENABLED` | `true` | Enables Tesseract OCR for screenshots. |
| `TRUSTSCAN_RATE_LIMIT_ENABLED` | `true` | Per-user/IP sliding-window limits. |
| `TRUSTSCAN_AUTO_CREATE_TABLES` | `true` | Disable in production; use Alembic. |

Frontend configuration is a single build-time variable:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Because it is embedded at build time, rebuild the web image when the public API URL changes.

---

## Investigation pipeline

Every investigation moves through eight persisted stages:

1. **Evidence intake** — normalise text; OCR images; extract PDF/TXT/MD/CSV content.
2. **Structured extraction** — URLs, phones, emails, money, organizations, requests, indicators.
3. **URL intelligence** — per-URL structural and brand-impersonation analysis.
4. **Trusted retrieval** — RAG over the curated knowledge base.
5. **Generative investigation** — threat category, intent, entities, claims, risk signals.
   Falls back to a transparent heuristic analyser when no LLM is configured or the call fails.
6. **Evidence correlation** — link independent signals into named patterns and a narrative.
7. **Risk assessment** — deterministic, explainable 0–100 score.
8. **Protection & response** — ranked, context-aware actions.

Stage status, duration and a short detail are stored in the report, so the UI can show exactly
where time went and how the conclusion was reached. In `background` mode the client polls the
detail endpoint while the investigation is `queued` or `running`.

---

## Risk model

| Band | Range | Meaning |
| --- | --- | --- |
| Low | 0–24 | Limited indicators — stay cautious. |
| Medium | 25–49 | Some indicators — verify independently. |
| High | 50–79 | Correlated risk — do not act yet. |
| Critical | 80–100 | Strong independent evidence — stop and protect. |

Design rules:

- Category labels provide context but are **not** counted again as evidence.
- An unknown sender does not imply fraud.
- Payment pressure plus urgency reaches at least HIGH, but not CRITICAL.
- CRITICAL requires strong independent technical evidence (e.g. known threat indicator,
  contradicted claim, or credential theft combined with a suspicious URL).
- The explanation names the signals that produced the score.

The bundled 20-case evaluation dataset lives in `data/test_cases/` and is exercised by the backend
test suite.

---

## API surface

Base path: `/api/v1` (health and metadata are also exposed at the root).

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account and start a session. |
| `POST` | `/auth/login` | Sign in. |
| `POST` | `/auth/refresh` | Rotate the refresh cookie, return a new access token. |
| `POST` | `/auth/logout` | Revoke the current refresh token. |
| `POST` | `/auth/logout-all` | Revoke every session for the user. |
| `GET/PATCH` | `/auth/me` | Read or update the profile. |
| `POST` | `/auth/me/change-password` | Change password and revoke all sessions. |
| `DELETE` | `/auth/me` | Delete the account and all owned data. |
| `POST` | `/investigations` | Create an investigation (multipart: `input_type`, `text`/`url`/`file`). |
| `GET` | `/investigations` | Paginated, filterable history (`q`, `risk_level`, `status`, `input_type`). |
| `GET` | `/investigations/{id}` | Full report with stages and evidence. |
| `POST` | `/investigations/{id}/retry` | Re-run a failed or stale investigation. |
| `GET` | `/investigations/{id}/export` | Download the report as JSON. |
| `DELETE` | `/investigations/{id}` | Delete an investigation and its upload. |
| `GET` | `/analytics/overview` | Workspace statistics and distributions. |
| `GET` | `/knowledge` | List indexed documents. |
| `GET` | `/knowledge/search` | Semantic search over the knowledge base. |
| `GET` | `/knowledge/{id}` | Document content and chunks. |
| `POST` | `/knowledge/reindex` | Re-index trusted documents (admin). |
| `GET` | `/health`, `/health/ready` | Liveness and readiness probes. |
| `GET` | `/meta` | Pipeline stages, risk bands, engine modes. |

Errors use a stable envelope:

```json
{ "error": { "code": "validation_error", "message": "…", "details": [] } }
```

---

## Testing

```bash
# Backend — API + domain tests on SQLite, inline pipeline, hash embeddings
cd backend && uv run pytest -q

# Lint and types
cd backend && uv run ruff check app tests scripts
cd frontend && npx eslint . && npx tsc --noEmit

# Frontend production build
cd frontend && npm run build
```

The suite covers authentication and session rotation, investigation lifecycle, evidence
extraction, URL intelligence, correlation, the risk engine (including independent-evidence
gating) and the full evaluation dataset.

---

## Production checklist

- [ ] `TRUSTSCAN_ENVIRONMENT=production` and a strong, stable `TRUSTSCAN_SECRET_KEY`.
- [ ] `TRUSTSCAN_COOKIE_SECURE=true` (automatic in production) with TLS terminated in front.
- [ ] `TRUSTSCAN_DEBUG=false`, `TRUSTSCAN_AUTO_CREATE_TABLES=false`, migrations applied by CI/CD.
- [ ] `TRUSTSCAN_CORS_ORIGINS` restricted to the real web origin.
- [ ] PostgreSQL backups for the `postgres-data` volume; object storage for uploads if scaling out.
- [ ] `TRUSTSCAN_LOG_JSON=true` and log shipping; optionally `TRUSTSCAN_SENTRY_DSN`.
- [ ] Rate limits enabled; consider an edge limiter in front of the API.
- [ ] Pin `NEXT_PUBLIC_API_URL` at build time and rebuild the web image per environment.
- [ ] Retention job (`make cleanup`) scheduled to honour `TRUSTSCAN_RETENTION_DAYS`.

---

## Legacy Streamlit MVP

The original single-process Streamlit prototype is preserved unchanged under
[`legacy/streamlit/`](legacy/streamlit/) for reference and comparison. It is not part of the
supported deployment; use the FastAPI + Next.js stack above.

---

## Disclaimer

TrustScan AI provides evidence-based risk intelligence. A high score means a communication warrants
verification and caution — it is **not** proof that a person, organization, phone number or URL is
fraudulent, and it is not legal or financial advice.
