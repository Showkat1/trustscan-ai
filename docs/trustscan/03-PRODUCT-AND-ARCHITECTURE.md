# 03 — Product & Architecture

## 1. Product principles

1. **Never say "safe".** The strongest permitted output is "no evidence of fraud found", always
   accompanied by what was and was not checked. A false "safe" is a liability event.
2. **Deterministic verdict, generative explanation.** The score and classification come from a
   versioned rules engine. The LLM writes prose and never sets a number.
3. **Reproducible.** The same artifact and ruleset version must produce the same verdict,
   indefinitely. This is the audit property and it constrains everything else.
4. **Evidence or silence.** No signal without a reference to what produced it. Missing evidence
   lowers confidence; it never adds an accusation.
5. **Degrade, do not fail.** Without an LLM the product still returns a complete verdict. This
   is already true and must remain a hard requirement.
6. **Tenant isolation is physical where required.** Banking buyers will ask; "logical
   isolation" is not an answer for some of them.

---

## 2. Module map

| # | Module | Buyer | Status | Phase |
|---|---|---|---|---|
| M1 | **Consumer Check** (web + WhatsApp) | End users | Shipped (web); WhatsApp new | 1 |
| M2 | **Adjudication API** | Institutions | Core logic shipped; API surface new | 1 |
| M3 | **Case Workflow** | Fraud ops teams | Not built | 2 |
| M4 | **Pattern & Indicator Feed** | Institutions | Partial (in-memory signals) | 2 |
| M5 | **White-label Protection Portal** | Banks, telcos | Not built | 3 |
| M6 | **Device Exposure Scan** | Consumer + onboarding risk | Shipped | 3 |
| M7 | **Compliance Evidence Export** | Compliance, audit | Partial (audit log) | 2 |
| M8 | **Benchmark & Accuracy Report** | All | Harness exists (20-case set) | 1 |

### M1 — Consumer Check

Web check is live. The India-specific addition is **WhatsApp forward-to-check**: user forwards
a suspicious message to a number, receives a verdict card in under 10 seconds. This is the
single highest-leverage distribution decision in the plan, because forwarding is the native
behaviour and the bot requires no install.

**MVD:** inbound message → pipeline → templated verdict card with a link to the full report.
Rate limit per number; abuse handling; opt-out.

### M2 — Adjudication API

The institutional product. Design the contract once, carefully, because it becomes the
integration surface that acquisition diligence examines.

```
POST /v1/adjudicate
  { artifact: {type: "text"|"url"|"image"|"file", content|url|upload_ref},
    context: {channel: "sms"|"whatsapp"|"email"|"web"|"app",
              locale: "en-IN"|"hi-IN"|"hinglish", product: "upi"|"card"|"loan"},
    tenant_ref: "case-123",
    idempotency_key: "..." }

200 {
  verdict: "likely_fraud" | "suspicious" | "no_evidence_of_fraud" | "insufficient_evidence",
  score: 0..100,
  confidence: 0..1,
  signals: [{ key, label, severity, weight, detail, evidence_ref }],
  evidence: [{ source, excerpt, relevance }],
  guidance: [{ title, detail, priority }],
  coverage: { checked: [...], not_checked: [...] },
  model: { mode: "deterministic"|"hybrid", ruleset_version, pipeline_version },
  audit: { verdict_id, created_at, request_hash }
}
```

Also: `POST /v1/adjudicate/batch`, `GET /v1/verdicts/{id}`, `POST /v1/verdicts/{id}/feedback`,
`GET /v1/indicators/{domain}`, `POST /v1/cases`, `PATCH /v1/cases/{id}`.

Webhooks: `verdict.completed`, `campaign.detected`, `case.escalated`.

**Design rules:**
- `idempotency_key` mandatory — institutions retry.
- `coverage.not_checked` is a first-class field, not a footnote.
- `model.ruleset_version` returned so a verdict can be re-read years later.
- p50 latency target < 800 ms deterministic, < 3 s hybrid.
- Synchronous for single artifacts; async with webhook for batches over 50.

### M3 — Case Workflow

Without this, the product is a smart API that a bank's analysts still cannot operate. The
minimum viable workflow is deliberately small:

queue → assignment → verdict display → disposition (`confirmed_fraud` / `false_positive` /
`inconclusive`) → export. Dispositions become labelled training data and benchmark cases.

### M4 — Pattern & Indicator Feed

Aggregate across tenants, privacy-preserving: domain reputation, campaign clusters, recurring
narrative templates, mule-account indicators reported by customers. This is the corpus that
makes the API better every week and that no single bank can build.

**Critical constraint:** cross-tenant sharing must be aggregate/anonymised, disclosed in the
contract, and never expose one tenant's cases to another. Get this wrong once and the entire
institutional business ends.

---

## 3. Shipped versus required — the real gap analysis

This is where the transformation work actually lives.

### Already sufficient

| Capability | Where | Assessment |
|---|---|---|
| Evidence extraction from text/URL/OCR/document | `services/evidence_extractor.py`, `documents.py`, `ocr.py` | Directly reusable |
| URL intelligence | `services/url_intelligence.py` | Reusable; add Indian domain/UPI signals |
| Retrieval over curated corpus | `services/rag.py`, `embeddings.py` | Reusable; corpus must be Indian and current |
| Correlation | `services/correlation.py` | Reusable |
| Deterministic scoring | `services/risk_engine.py` | Reusable; version the ruleset |
| Guidance generation | `services/actions.py` | Reusable |
| Deterministic fallback without LLM | `services/llm.py`, `analysis_mode` | Keep as a contract, not a fallback |
| Audit trail | `models/audit.py` | Reusable; add export |
| Auth + session rotation | `api/auth.py`, `core/security.py` | Reusable |
| Rate limiting | `core/rate_limit.py` | Reusable per tenant, needs quotas |
| Deployment | `Dockerfile`, `docker-compose.yml`, Alembic | Reusable; add hardened profile |

### Required, not built — the 18-month work

| Gap | Why a bank requires it | Effort |
|---|---|---|
| **Organisation / tenant model** | Every record must be scoped to a contracting entity | 3 weeks |
| **RBAC beyond user/admin** | Analyst, supervisor, auditor, integration service accounts | 2 weeks |
| **API keys, quotas, metering** | Contractual volume limits and billing | 2 weeks |
| **Batch + async + webhooks** | Institutions process in bulk, not one at a time | 3 weeks |
| **Case workflow** | Their analysts need a queue, not a JSON response | 5 weeks |
| **Verdict store + indicator cache** | Reproducibility and cost (see §6) | 2 weeks |
| **Ruleset versioning + change log** | "Why did the verdict change?" must have an answer | 2 weeks |
| **Data residency / VPC deployment** | Many Indian regulated entities will not accept shared SaaS | 4 weeks |
| **SSO (SAML/OIDC)** | Standard enterprise requirement | 2 weeks |
| **Observability, SLA dashboards** | Contractual uptime and incident evidence | 2 weeks |
| **PII redaction before external calls** | DPDP data-minimisation obligation | 1 week |
| **Regulator-ready audit export** | Inspection response in a usable format | 2 weeks |
| **Localisation (Hinglish, Devanagari, regional scripts)** | The actual content users receive | 4 weeks |
| **Benchmark harness at scale** | Accuracy claims need evidence, not adjectives | 3 weeks |
| **Billing / invoicing** | Invoicing, GST, purchase orders | 1 week |

Total: roughly **38 engineer-weeks** — nine months for one engineer, four to five months for
two. None of it is research.

---

## 4. Target architecture

### Two deployment shapes, one codebase

```
┌─────────────────────── CONTROL PLANE (our SaaS) ────────────────────────┐
│  tenant provisioning · billing · ruleset releases · benchmark service   │
│  aggregate indicator feed (privacy-preserving) · support tooling        │
└───────────────┬──────────────────────────────────┬──────────────────────┘
                │ signed ruleset & corpus sync     │ metered usage
┌───────────────▼──────────────────┐  ┌────────────▼─────────────────────┐
│  DATA PLANE — shared SaaS        │  │  DATA PLANE — tenant VPC / on-prem│
│  (PAs, fintechs, SFBs)           │  │  (banks that require it)          │
│  multi-tenant, row-level scoping │  │  single-tenant, no outbound PII   │
└──────────────────────────────────┘  └───────────────────────────────────┘
```

Both run the same container image with different configuration. The on-prem profile must work
**air-gapped**: deterministic-only mode, locally loaded corpus, no telemetry beyond counters.
That constraint is what makes bank deals possible and is why the deterministic engine is a
strategic asset rather than a fallback.

### Service layout (unchanged shape)

```
api/        public  · consumer · institutional · admin  (fastapi router per surface)
services/   pipeline · evidence · url_intel · rag · llm · correlation
            risk_engine (versioned ruleset) · actions · device_scan
            NEW: adjudication · verdict_cache · indicator_store · ruleset_registry
models/     User · Organization · Membership · ApiKey · Verdict · Case · Indicator
            · RulesetVersion · KnowledgeDoc/Chunk · AuditEvent · UsageMeter
workers/    batch adjudication · corpus refresh · campaign clustering
```

**Deliberate constraint:** still one deployable service. Microservices before $1M ARR are a
cost, not an architecture. The control/data plane split is a deployment boundary, not a
distribution of codebases.

---

## 5. Data model additions

| Table | Key columns | Purpose |
|---|---|---|
| `organizations` | `id`, `name`, `segment`, `plan`, `deployment` (`saas`/`vpc`), `status` | Tenant root |
| `memberships` | `org_id`, `user_id`, `role` (`analyst`/`supervisor`/`auditor`/`admin`) | RBAC |
| `api_keys` | `org_id`, `key_hash`, `scopes`, `quota_month`, `last_used_at` | Machine access |
| `verdicts` | `org_id`, `request_hash`, `verdict`, `score`, `confidence`, `signals` (JSON), `evidence` (JSON), `coverage` (JSON), `ruleset_version`, `pipeline_version`, `latency_ms` | Reproducible record |
| `indicator_cache` | `indicator_hash`, `kind` (domain/phone/narrative), `verdict`, `seen_count`, `first_seen`, `last_seen` | Cost and speed |
| `cases` | `org_id`, `verdict_id`, `assignee_id`, `state`, `disposition`, `disposition_note`, timestamps | Workflow |
| `indicators` | `kind`, `value_hash`, `reputation`, `sources`, `confidence`, `ttl` | Corpus |
| `ruleset_versions` | `version`, `checksum`, `notes`, `released_at`, `superseded_at` | Governance |
| `usage_meters` | `org_id`, `period`, `verdicts`, `overage`, `cost_estimate` | Billing |

`investigations` and `device_scans` remain for the consumer product. Do not merge them into the
institutional tables — the retention, consent and sharing rules differ.

---

## 6. Cost and latency architecture

Scam content is **highly repetitive**: campaigns reuse templates, domains and scripts. This is
the single most important economic fact in the product.

```
artifact ──► normalise ──► hash ──► indicator_cache hit? ──yes──► verdict (<50ms, ~₹0)
                                        │ no
                                        ▼
                              full pipeline (deterministic)
                                        │
                              optional LLM explanation
                                        ▼
                                   store verdict
```

| Path | Latency | Marginal cost |
|---|---|---|
| Cache hit (exact artifact) | < 50 ms | ~₹0 |
| Cache hit (indicator) | < 300 ms | ~₹0.05 |
| Deterministic miss | < 800 ms | ~₹0.10 |
| Hybrid miss (with explanation) | < 3 s | ~₹1.50–3.00 |

At steady state, 55–70% of institutional volume should hit a cache. That is what makes 75–80%
gross margin possible on contracts priced per case, and it is a structural advantage over
competitors who call a model on every request.

**Guardrails:** per-tenant monthly LLM budget enforced in code; on exhaustion, degrade to
deterministic explanations rather than failing the request or losing money.

---

## 7. Explainability and model governance

| Requirement | Implementation |
|---|---|
| Reproduce any verdict | Store `ruleset_version` + `request_hash` + full signal set; re-run is deterministic |
| Explain a change | Ruleset change log with rationale and affected signal keys; verdict diff tool |
| Prove accuracy | Labelled benchmark (start from the existing 20-case set, grow to 2,000+), published precision/recall by category |
| Detect drift | Weekly benchmark run; alert on >3pp movement in any category |
| Refuse to guess | `insufficient_evidence` is a valid, common verdict |
| Audit model use | Log whether the LLM was invoked, which model, and what it changed |

**Ruleset release process:** version → benchmark → diff → staged rollout per tenant → rollback
window. A bank will ask how a rules change could alter yesterday's verdicts; the answer must be
"it cannot, because each verdict records its ruleset version".

---

## 8. Compliance architecture

| Obligation | Source (verify current text) | Implementation |
|---|---|---|
| Purpose limitation, consent | DPDP Act 2023 | Explicit purpose at collection; consumer consent screen; institutional DPA defines purpose |
| Data minimisation | DPDP | Hash indicators; redact PII before any external model call |
| Retention limits | DPDP + contractual | Configurable retention per tenant; default 180 days for raw artifacts, longer for aggregates |
| Deletion / data-principal rights | DPDP | Export and hard delete, tested, with audit evidence |
| Breach notification | DPDP + CERT-In directions | Incident runbook with defined reporting clock |
| Log retention | CERT-In directions | 180-day rolling, tamper-evident |
| Vendor outsourcing obligations | RBI Master Direction on IT Outsourcing | Audit rights, exit clause, data localisation, subcontractor disclosure, BCP |
| Data localisation | RBI / sector expectations | India-region hosting; VPC option; no cross-border processing of raw artifacts |
| Supervisory access | RBI inspection practice | Regulatory export bundle from the audit trail |

**Certifications, sequenced:** ISO 27001 (Phase 3) and a CERT-In-empanelled VAPT plus a
cyber-liability policy (Phase 2). SOC 2 Type II only if a US/global buyer asks; it is expensive
and not a prerequisite in India.

---

## 9. Liability framing

This is a product decision and a contract decision, and getting it wrong is existential.

| Rule | Rationale |
|---|---|
| Never output "safe" | A false negative becomes "your vendor said it was safe" |
| Always output coverage | The institution must see what was not examined |
| Human decision retained | Adverse action against a customer stays with the regulated entity |
| Confidence is explicit | Low-confidence verdicts are surfaced, not hidden behind a score |
| No automated blocking | We inform; the institution acts. This keeps us outside the authorisation path and outside much of the liability |
| Contractual cap + insurance | Standard for the category; do not sell uncapped |

---

## 10. What we deliberately do not build

| Rejected | Reason |
|---|---|
| Transaction monitoring / authorisation scoring | Different data, different latency bar, different vendors, and it puts us in the liability path |
| KYC / identity verification | Adjacent but separate; competing with Perfios/Signzy is a different company |
| A fraud call centre | Services revenue destroys the SaaS multiple and does not scale |
| Consumer subscription as primary revenue | Low willingness to pay; consumer exists to distribute and to build corpus |
| On-prem for every tenant | Expensive to support; reserve for deals that justify it (~₹40L+) |
| Custom model training per bank | Turns a product into consulting; ruleset configurability is the right lever |
