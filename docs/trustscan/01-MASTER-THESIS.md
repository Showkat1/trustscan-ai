# 01 — Master Thesis

## 1. The shift

TrustScan is currently a working investigation product: a user submits a suspicious message,
link, screenshot or document and receives an evidence-grounded verdict with a risk score, a
correlation narrative and a ranked action plan. It runs without an LLM key, persists every
stage, and audits every action.

That is a good consumer utility. It is a poor business on its own, because the person who
needs it most is the least able to pay for it, at the exact moment they are least willing to
open a second app.

The same engine, sold to the institution on the other side of that message, is a different
business entirely. The bank must answer the customer. It must answer the regulator. It must
prove the answer was not invented. It must do this tens of thousands of times a month, and it
has no tooling that produces a *defensible* verdict — only dashboards, rules and a queue of
screenshots.

**The transformation is repositioning the unit of value from "a verdict for a person" to "a
defensible verdict at institutional volume, with the evidence attached".**

---

## 2. Why India, specifically

India is not a convenience market for this product. It is the market where the problem is
largest, the liability is clearest, and the incumbent tooling is weakest.

| Structural condition | Consequence for us |
|---|---|
| Real-time payments at population scale (UPI processes double-digit billion transactions monthly — verify current NPCI figures) | Fraud attempts are instant, irreversible and high-volume; every disputed payment generates an investigation |
| Fraud has migrated from card data to **social engineering** ("authorised push payment" style) | The evidence is a *narrative* — an SMS, a WhatsApp forward, a screenshot — which is exactly what our pipeline parses |
| Regulated entities carry the liability and must evidence their controls | A buyer exists who is legally motivated, budgeted and audited |
| Fraud teams triage customer screenshots manually | A measurable cost per case that we can cut, which is the easiest sale in enterprise software |
| Regional language and idiom variation | Global vendors' models degrade on Hinglish, transliterated Hindi, regional scripts; this is a defensible local advantage |
| Data protection law now imposes real obligations (DPDP Act 2023; confirm current rules status) | Compliance becomes a purchasing criterion, and a barrier to sloppy competitors |
| RBI outsourcing and IT governance expectations force vendor scrutiny | Standards we can meet deliberately, and which raise the bar for a two-person competitor |

The last two rows are the moat argument. In a market where every vendor can call an LLM API,
**the ability to pass a bank's vendor risk assessment is the product.**

---

## 3. The asymmetry that makes this defensible

There are three ways to answer "is this fraudulent?":

| Approach | Who uses it | Why it fails at institutional volume |
|---|---|---|
| Rules and blocklists | Most banks today | Brittle, easily evaded, generates false positives that anger customers |
| Pure LLM judgement | New entrants, chatbots | Non-deterministic, unexplainable, cannot be defended in a dispute or an audit |
| **Deterministic evidence pipeline + LLM for language only** | Us | Requires real engineering, which is why it is rare — and why it survives scrutiny |

An institution cannot ship an answer it cannot justify. "The model said so" is not a defence in
a customer complaint, an RBI inspection, or a court. Our architecture produces the same verdict
for the same input, with named signals, weights and citations — and it degrades gracefully to a
fully deterministic mode when the LLM is unavailable.

That is the whole moat, and it is a governance property rather than a feature. A competitor can
copy a screen in a week; copying the auditability contract means rebuilding their pipeline.

---

## 4. The two-sided motion

```
                     ┌──────────────────────────────┐
                     │  Consumer wedge (free)       │
                     │  WhatsApp forward-to-check   │
                     │  web check · QR check        │
                     └──────────────┬───────────────┘
                                    │ volume, reports, patterns
                                    ▼
   ┌────────────────────────────────────────────────────────────┐
   │  TrustScan adjudication engine (already built)             │
   │  evidence → correlation → deterministic score → guidance   │
   └──────────────┬──────────────────────────┬──────────────────┘
                  │                          │
                  ▼                          ▼
     ┌─────────────────────┐     ┌──────────────────────────┐
     │ Institutional API   │     │ Pattern corpus           │
     │ banks · PAs · SFBs  │     │ indicators · campaigns   │
     │ telcos · marketplaces│     │ domain reputation        │
     └─────────────────────┘     └──────────────────────────┘
```

**The consumer side is not the revenue. It is three things at once:**

1. **Distribution** — forwarded messages are India's native sharing primitive. A bot that
   answers in 8 seconds inside WhatsApp acquires users with zero paid spend.
2. **Corpus** — every check produces a labelled artifact and a domain reputation record. This
   compounds into an asset that no bank can build alone, because banks only see their own
   customers.
3. **Inbound** — the fastest way to sell to a bank is for its customers to already be using
   something that names the bank's fraud patterns.

**The institutional side is the revenue.** It pays for the engine, and it makes the corpus
commercially valuable rather than merely interesting.

---

## 5. Why us

| Asset | Current state | Why it is hard to copy |
|---|---|---|
| Evidence pipeline | Built, tested, documented | 9–12 months of unglamorous work; competitors ship prompts |
| Deterministic scoring | Built, with written justification | Forces product discipline; LLM-first teams cannot retrofit it |
| Claim verification | Built (`verified` / `contradicted` / `requires_verification`) | The exact property a regulator asks about |
| Audit trail | Built | Enterprise sales prerequisite, not a feature |
| Document/OCR intake | Built | Screenshots are the real-world input format |
| Device exposure scan | Built | Unusual signal for onboarding risk and consumer trust |
| Localisation headroom | Not built | Our advantage to lose; global vendors will not prioritise Hinglish |

The honest limitation: we have **no institutional reference customer, no certifications, and
no multi-tenant architecture**. Every one of those is a Phase 1–3 deliverable, and none of them
is a research problem.

---

## 6. What this is not

Scope discipline matters more here than in consumer software, because enterprise scope creep is
paid for in procurement cycles.

- **Not a KYC or identity vendor.** We do not verify who someone is; we adjudicate what they
  were sent. Competing with Perfios, Signzy, IDfy or Karza is a different company.
- **Not a transaction monitoring system.** We do not sit in the payment authorisation path. We
  analyse the *narrative* around a case: what the customer received, what they clicked, what
  they were told.
- **Not a call centre or a managed service.** We sell software and, later, an analyst-assist
  workflow. We do not staff a fraud desk.
- **Not a consumer subscription business.** Consumer revenue is a rounding error and chasing it
  would distort the product toward engagement instead of accuracy.
- **Not a global enterprise vendor on day one.** Global banks have 18-month procurement; we
  cannot survive that before revenue exists.

---

## 7. Platform logic

Three properties turn a product into something an acquirer buys rather than licenses:

1. **Recurring, contracted revenue** with a measurable cost saving per case (Phase 2).
2. **A proprietary corpus** — India-specific scam patterns, domains, campaign clusters and
   outcome labels that no single institution can assemble (Phase 2–3).
3. **An integration surface others build on** — the adjudication API and the pattern feed, which
   is what makes an acquirer's existing distribution more valuable rather than merely larger
   (Phase 4).

Phase 4 is where the multiple changes. Phases 1–3 are about earning the right to build it.

---

## 8. Definition of success, staged

| Horizon | Product truth | Commercial truth | Diligence truth |
|---|---|---|---|
| 6 mo | Consumer check is accurate and fast enough to share | 1 paid pilot, 10k checks | Accuracy benchmark published |
| 12 mo | Same engine serves both sides without a fork | $250k ARR, 8 accounts | DPDP-aligned data map |
| 18 mo | VPC deployment works in a bank's environment | $600k ARR, 20 accounts, 2 partners | ISO 27001 audited, pen test clean |
| 24 mo | Pattern corpus is the reference for India scam campaigns | $0.8–1.8M ARR (base $840k) | Data room, buyer conversations |

---

## 9. The failure mode to avoid

The most likely failure is becoming a **demo that never clears procurement**: impressive in a
meeting, un-certifiable in a bank, priced below the cost of the support it requires, and
dependent on a founder who is also the entire sales team.

Every decision in [03](03-PRODUCT-AND-ARCHITECTURE.md) exists to make the product certifiable,
and every gate in [04](04-ROADMAP.md) exists to detect the demo trap before it consumes two
years. The specific antidote is **paid pilots with smaller regulated entities** — a payment
aggregator can sign in six weeks what a public sector bank takes eighteen months to consider.
