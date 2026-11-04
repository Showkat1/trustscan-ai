# TrustScan AI — Master Transformation Strategy

**Status:** Draft v1.0 · 05 Nov 2026
**Scope:** Commercialisation of the working application into an institutional fraud-intelligence platform
**Beachhead:** India · **Revenue motion:** institutional API + consumer wedge
**Endgame:** acquisition-ready in 18–24 months

---

## The thesis in one paragraph

India runs the highest-volume real-time payment rails in the world on top of a population that
receives more fraud attempts than any support organisation can answer. Banks are liable,
regulated and audited, but their fraud teams still triage customer-reported screenshots by
hand. TrustScan already does the hard part — it turns an unstructured artifact (message, URL,
screenshot, document) into an evidence-grounded, explainable verdict with an audit trail. The
transformation is not a rebuild; it is **productising an engine we already own for the buyers
who are legally obliged to care**, with a free consumer checker as the wedge that earns
distribution and the corpus that no vendor can buy.

---

## Document map

| # | Document | Answers | Primary reader |
|---|---|---|---|
| 01 | [Master Thesis](01-MASTER-THESIS.md) | Why this wins, for whom, and what changes | Founder, investor |
| 02 | [Market & Competition](02-MARKET-AND-COMPETITION.md) | India sizing, buyer map, competitor gap | Founder, investor |
| 03 | [Product & Architecture](03-PRODUCT-AND-ARCHITECTURE.md) | What is already built, what enterprise requires | CTO, technical diligence |
| 04 | [Roadmap & Gates](04-ROADMAP.md) | Sequence, cost, and when to stop | Founder, operator |
| 05 | [Economics & GTM](05-ECONOMICS-AND-GTM.md) | Pricing, margins, and how institutions get sold | Founder, investor |
| 06 | [Investor & Acquisition Readiness](06-INVESTOR-AND-ACQUISITION-READINESS.md) | Data room, buyer map, valuation | Founder, banker |
| 07 | [Risk Register](07-RISK-REGISTER.md) | What kills this, and the tripwires | Founder, board |

**Reading paths:** investor → 01, 02, 05, 06 · acquirer → 06, 02, 03 · engineer → 03, 04.

---

## Decisions this strategy forces

| ID | Decision | Recommendation | Deadline | Status |
|---|---|---|---|---|
| D1 | Revenue motion | Institutional API first, consumer wedge as distribution | Week 1 | **Decided** |
| D2 | Beachhead | India — payment aggregators and small finance banks before tier-1 PSBs | Week 1 | **Decided** |
| D3 | Wedge product | Free consumer check, WhatsApp forward-to-check as the primary entry | Week 3 | Recommended |
| D4 | First buyer profile | Payment aggregators, neobanks, SFBs, co-operative banks — not the top 4 PSBs | Week 3 | Recommended |
| D5 | Deployment model | Multi-tenant SaaS first, VPC/on-prem by Phase 3 | Week 4 | Recommended |
| D6 | Exit | Strategic acquirer at 18–24 months, $600k+ ARR entry | Month 1 | Recommended |

**D1 and D2 are settled by your direction.** Everything downstream is written to them.

---

## What is actually being transformed

This is a commercialisation, not a pivot. The domain stays the same, so almost nothing is
thrown away:

| Already shipped | Enterprise requirement it satisfies |
|---|---|
| 8-stage evidence pipeline with per-stage persistence | Explainability a regulator or auditor can read |
| Deterministic scoring with written justification | Same verdict for same input — the core audit property |
| Claim verification (`verified` / `contradicted` / `requires_verification`) | Defensible output, no hallucinated accusations |
| Full audit trail of actions and actors | Dispute handling and supervisory review |
| Session rotation, rate limiting, per-user isolation | Baseline security posture a bank will test |
| Document + OCR intake | Screenshots and PDFs are how customers actually report fraud |
| Device exposure scanner | Differentiated risk signal for onboarding and consumer trust |
| Dockerised deployment, migrations, test suite | A credible technical diligence story from day one |

The gap is not intelligence. The gap is **everything an institution requires around the
intelligence**: multi-tenancy, role separation, case workflow, SLA, data residency, model
governance, liability framing and billing. That is the actual work of the next 18 months, and
it is far cheaper than inventing the engine.

---

## Success definition

| Horizon | Target | Why it matters |
|---|---|---|
| 6 months | 1 paid institutional pilot, 10,000 consumer checks, published accuracy benchmark | Proves someone pays and the wedge distributes |
| 12 months | $250k ARR, 8 institutional accounts, DPDP-aligned data handling | Proves repeatable institutional sales |
| 18 months | $600k ARR, 20 accounts, VPC deployment live, 2 channel partners | Clears the strategic-buyer size threshold |
| 24 months | Base $840k ARR (upside $1.8M), 24 accounts, data room live | Sellable at 3–5× ARR, or raise on strength |

The 18- and 24-month figures are the Phase 3 and Phase 4 gates in [04](04-ROADMAP.md). The base
case in [02](02-MARKET-AND-COMPETITION.md) §3 lands at **$840k at 24 months**; the gates describe
the funded path, and the gap between them is the sales-capacity decision in
[05](05-ECONOMICS-AND-GTM.md) §3.

---

## The one-line risk

Banking buyers are slow, procurement-heavy and will ask for documents we do not yet have. The
plan is therefore built around **paying pilots with smaller institutions first**, so revenue
and references exist before the first tier-1 bank conversation — and so that a single stalled
procurement cycle cannot end the company.
