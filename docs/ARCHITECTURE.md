# Architecture

This document describes how the TrustScan AI platform is put together: request flow, data model,
the investigation pipeline, the RAG and risk subsystems, and the frontend. It complements the
root [README](../README.md).

---

## 1. System context

TrustScan is a two-service application plus a database:

| Component | Responsibility |
| --- | --- |
| `web` (Next.js) | Presentation, client-side routing, session bootstrap, polling for in-flight investigations. |
| `api` (FastAPI) | Authentication, authorisation, investigation orchestration, extraction, retrieval, scoring, analytics. |
| `db` (PostgreSQL + pgvector) | Durable state: users, refresh sessions, investigations, reports, knowledge documents and chunk embeddings. |

The browser talks to the API directly over JSON (and multipart uploads). The web container does
not proxy API traffic; `NEXT_PUBLIC_API_URL` is embedded at build time. This keeps the frontend
stateless and horizontally scalable.

```
Browser ──► Next.js (RSC + client) ──► FastAPI ──► PostgreSQL/pgvector
                        ▲                  │
                        └── polling ───────┘  (queued/running investigations)
```

---

## 2. Backend structure

```
app/
├── main.py            App factory, lifespan, middleware, exception handlers, routers
├── api/               HTTP layer (routers + dependencies)
│   ├── auth.py        Register/login/refresh/logout/profile/password/delete
│   ├── investigations.py  Create/list/detail/retry/export/delete
│   ├── analytics.py   Workspace overview aggregates
│   ├── knowledge.py   Documents, semantic search, reindex
│   └── system.py      /health, /health/ready, /meta
├── core/
│   ├── config.py      Pydantic settings (TRUSTSCAN_* env prefix)
│   ├── db.py          Async engine/session, Base, init_models
│   ├── security.py    Argon2 hashing, JWT encode/decode, token helpers
│   ├── logging.py     structlog configuration
│   ├── rate_limit.py  In-process sliding-window limiter
│   └── errors.py      AppError hierarchy + error codes
├── models/            SQLAlchemy 2.1 declarative models
├── schemas/           Pydantic request/response contracts
└── services/
    ├── pipeline.py        8-stage orchestration, persistence, report assembly
    ├── evidence_extractor.py  Deterministic entity/signal extraction
    ├── url_service.py      URL structure + brand impersonation analysis
    ├── rag.py              Indexing, seeding and retrieval
    ├── llm.py              Generative analysis + heuristic fallback
    ├── risk_engine.py      Explainable scoring and banding
    ├── correlation.py      Cross-signal pattern detection
    ├── actions.py          Context-aware protection guidance
    ├── ocr.py              Tesseract integration
    ├── documents.py        PDF/TXT/MD/CSV text extraction
    └── storage.py          Upload persistence and cleanup
```

### Layering rules

- Routers never contain domain logic; they validate input, resolve the current user, and delegate.
- Services receive plain data and SQLAlchemy sessions; they do not depend on FastAPI.
- Schemas define the public contract. ORM models are never returned directly.

### Request middleware

Every request gets a request ID (inbound `X-Request-ID` or generated), bound into structlog
context. The middleware also adds security headers (`X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`, and HSTS in production) and logs method, path, status and
duration. Unhandled exceptions are logged and returned as a stable error envelope.

---

## 3. Data model

| Table | Key columns | Notes |
| --- | --- | --- |
| `users` | `id`, `email` (unique), `password_hash`, `full_name`, `role`, `is_active`, timestamps | Argon2 password hashes; role drives admin-only actions. |
| `refresh_sessions` | `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `user_agent`, `ip` | One row per active refresh token; rotation and revocation. |
| `investigations` | `id`, `user_id`, `input_type`, `status`, `stage`, `stage_index`, `text`, `url`, `file_*`, `risk_score`, `risk_level`, `report` (JSON), timestamps | Owns the full report JSON and denormalised summary columns used by list/filter queries. |
| `knowledge_documents` | `id`, `title`, `source`, `category`, `content`, `checksum` | Curated trusted guidance. |
| `knowledge_chunks` | `id`, `document_id`, `chunk_index`, `content`, `embedding vector(384)` | pgvector index; SQLite fallback stores JSON and scores in-process. |

Summary columns (`risk_score`, `risk_level`, `threat_category`, `correlation_level`,
`analysis_mode`, `duration_ms`) are written when the pipeline completes so history and analytics
queries avoid parsing report JSON.

### Migrations

Alembic owns the schema. The initial migration enables `CREATE EXTENSION IF NOT EXISTS vector`,
creates the tables, indexes and the embedding column. `TRUSTSCAN_AUTO_CREATE_TABLES` exists for
local/demo convenience; production deployments run `alembic upgrade head` (the API container does
this before starting Uvicorn).

---

## 4. Authentication and session model

```
register/login ──► access token (JWT, 15 min, in memory/sessionStorage)
                └─► refresh token (opaque, httpOnly cookie, 30 days, hashed in DB)

expired access ──► POST /auth/refresh (cookie) ──► rotate refresh token, new access token
```

- Access tokens are short-lived and carry `sub`, `role`, `jti` and expiry.
- Refresh tokens are random, stored **hashed** with expiry, user agent and IP. Refresh rotates the
  row: the old token is revoked and a new one issued.
- `logout` revokes one session; `logout-all` and password changes revoke every session.
- Cookies are `httpOnly`, `SameSite=Lax`, `Path=/api/v1/auth`, and `Secure` in production.
- The frontend keeps the access token in `sessionStorage` (never `localStorage`), and performs a
  single-flight refresh on `401` before retrying the original request once.
- Login and registration are rate limited per IP; investigation creation per user.

Authorisation is ownership-based: queries are always scoped by `user_id`, so one account cannot
read, export or delete another account's investigations.

---

## 5. Investigation pipeline

`services/pipeline.py` orchestrates eight stages. Each stage records `status`, `duration_ms` and a
human-readable `detail`; the report stores the resulting list.

| # | Stage | Input | Output |
| --- | --- | --- | --- |
| 1 | Intake | `input_type` + text/url/file | Normalised text (OCR / document extraction as needed) |
| 2 | Extraction | Text | URLs, phones, emails, money, organizations, requests, indicators, categories |
| 3 | URL intelligence | Extracted URLs | Per-URL structure, brand mismatch, shortener/punycode flags, assessment |
| 4 | Retrieval | Text + extracted signals | Top-k trusted passages with relevance scores |
| 5 | Analysis | Text, evidence, URL intel, sources | Threat category, intent, entities, claims, risk signals, summary |
| 6 | Correlation | Signals + evidence | Named patterns, relationships, correlation score/level, narrative |
| 7 | Risk | Signals + evidence + correlation | Score (0–100), band, written explanation |
| 8 | Guidance | Risk + context | Ranked actions and notes |

### Execution modes

- **background** (default) — the API creates the investigation as `queued`, returns immediately and
  runs the pipeline in a managed task. The client polls the detail endpoint.
- **inline** — the pipeline runs inside the create request. Used by the test suite and
  single-process demos.

Failures mark the investigation `failed`, persist `error_message`, and remain retryable through
`POST /investigations/{id}/retry`. Pipeline execution is bounded by
`TRUSTSCAN_PIPELINE_TIMEOUT_SECONDS`.

### Analysis fallback

`services/llm.py` requests structured JSON from an OpenAI-compatible endpoint and validates it
against Pydantic models. If no key is configured, the call fails, times out, or returns invalid
JSON, the service falls back to a deterministic heuristic analyser and records
`analysis_mode = deterministic_fallback` (or `deterministic`) plus explanatory notes. The report is
always complete; degraded analysis is disclosed rather than hidden.

---

## 6. Retrieval-augmented generation

1. **Corpus** — Markdown/text guidance in `data/knowledge_base/`, optionally seeded at startup.
2. **Indexing** — documents are chunked, embedded, and written to `knowledge_chunks`. Checksums
   prevent duplicate re-indexing unless `force=true`.
3. **Embeddings** — pluggable provider:
   - `openai` — remote embeddings;
   - `sentence-transformers` — local model;
   - `hash` — deterministic feature hashing, no network, used by default and in CI.
4. **Search** — pgvector cosine distance in PostgreSQL; in-process cosine similarity on SQLite.
   Results below `TRUSTSCAN_RAG_MIN_SCORE` are discarded, and the top `TRUSTSCAN_RAG_TOP_K` passages
   are attached to the report with source metadata and relevance.

Retrieved passages are passed to the analysis stage and surfaced in the UI, so conclusions can be
traced back to guidance rather than asserted without support.

---

## 7. Risk engine

The engine is deliberately deterministic so the same evidence always produces the same score.

1. **Signal weights** — credential requests, advance payment, urgency, suspicious URLs,
   impersonation, known threat indicators, contradicted claims, and contextual categories each
   contribute a bounded weight.
2. **Evidence bonuses** — small increments for independently observed evidence types (URL, phone,
   money, credentials, …).
3. **Correlation bonus** — additional weight when multiple independent signals reinforce each
   other.
4. **Gating** — specific combinations force a floor or a ceiling:
   - payment + urgency ⇒ at least HIGH, capped below CRITICAL without technical evidence;
   - impersonation without technical corroboration is capped;
   - CRITICAL requires strong independent evidence.
5. **Banding** — LOW (0–24), MEDIUM (25–49), HIGH (50–79), CRITICAL (80–100).
6. **Explanation** — generated from the signals that actually contributed, not a generic template.

The 20-case evaluation dataset in `data/test_cases/` asserts expected bands and is part of the test
suite, guarding against scoring regressions.

---

## 8. Frontend

```
src/
├── app/
│   ├── layout.tsx          Root providers, metadata, fonts (system stack)
│   ├── page.tsx            Public landing page
│   ├── (auth)/             Login and registration split layout
│   ├── (app)/              Protected shell: dashboard, investigate, history,
│   │                       investigations/[id], knowledge, settings
│   ├── error.tsx           Route error boundary
│   └── not-found.tsx       404
├── components/
│   ├── ui/                 Design-system primitives (Radix + CVA)
│   ├── layout/app-shell    Sidebar, topbar, mobile drawer, user menu
│   ├── investigation/      Status, risk and type badges
│   └── report/             Stage timeline, correlation graph, risk gauge
└── lib/
    ├── api.ts              Typed fetch client, token storage, refresh-retry
    ├── auth-context.tsx    Session bootstrap and auth actions
    ├── query-provider.tsx  TanStack Query defaults
    ├── types.ts            Shared API contracts
    └── utils.ts            Formatting and risk tone helpers
```

### Rendering and state

- Route groups separate public/auth/app layouts. `(app)/layout.tsx` renders `AppShell`, which gates
  on auth status and redirects anonymous users to `/login`.
- Session bootstrap: hydrate token from `sessionStorage`, attempt `POST /auth/refresh`, then load
  `/auth/me`. Failures resolve to anonymous without flashing protected content.
- Server state lives in TanStack Query. Mutations invalidate `investigations` and `overview`
  queries; the report page polls every 1.2 s only while the investigation is `queued`/`running`.
- The report view is tabbed (overview, evidence, correlation, sources, actions) and includes JSON
  export, retry and delete with confirmation.

### Design system

Dark-only cyber-security aesthetic: deep navy surfaces, teal/cyan accents, subtle aurora and grid
backgrounds, glass panels. Tailwind 4 tokens are declared in `globals.css` under `@theme`. Fonts
are a system stack, so the app renders offline without external requests. Animations respect
`prefers-reduced-motion`. Focus states, ARIA labels and keyboard-operable Radix primitives are used
throughout.

---

## 9. Failure handling and observability

| Failure | Behaviour |
| --- | --- |
| LLM unavailable / invalid JSON | Deterministic fallback, `analysis_mode` disclosed, notes added. |
| Embedding provider unavailable | Falls back to hash embeddings (no external calls). |
| OCR binary missing | Screenshot investigation fails with a clear, retryable error. |
| Upload too large / wrong type | `413`/`422` with a stable error envelope before processing. |
| Pipeline exception | Investigation marked `failed`, message stored, retry endpoint available. |
| Database integrity conflict | `409` conflict envelope. |
| Expired access token | Client refreshes once and retries; otherwise redirects to sign-in. |

Logging is structured (structlog). Containers emit JSON (`TRUSTSCAN_LOG_JSON=true`) with request IDs
and durations. `/health` is a liveness probe; `/health/ready` verifies the database. Both are used
by Docker Compose health checks and are safe for orchestrators.

---

## 10. Scaling and extension points

- **API** is stateless apart from in-process rate limiting and background tasks. To scale
  horizontally, move the limiter to Redis and the pipeline to a worker queue (Celery/RQ/Arq);
  the pipeline service is already isolated from the HTTP layer.
- **Uploads** are local by default; swap `services/storage.py` for S3-compatible object storage.
- **Embeddings** can be upgraded per deployment without schema changes by keeping
  `TRUSTSCAN_EMBEDDING_DIM` in sync with the vector column.
- **Knowledge base** can be extended by dropping documents into `data/knowledge_base/` and calling
  `POST /knowledge/reindex`.
- **Analysis** can be swapped by implementing the structured contract in `services/llm.py`; the
  rest of the pipeline is provider-agnostic.

---

## 11. Testing strategy

- **Backend** — pytest with an isolated SQLite database, inline pipeline, hash embeddings and rate
  limiting disabled. Coverage includes auth/session rotation, ownership checks, investigation
  lifecycle, extraction, URL intelligence, correlation, risk gating, and the 20-case evaluation
  dataset.
- **Frontend** — ESLint (Next core-web-vitals + TypeScript), `tsc --noEmit`, and a production
  `next build`. Lint rules include React 19's `set-state-in-effect`, so state is derived during
  render or in event handlers rather than synchronised in effects.
- **CI** — GitHub Actions runs backend lint/tests, frontend lint/types/build, and builds both
  Docker images with layer caching.
