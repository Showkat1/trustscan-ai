# 05 — Economics & GTM

## 1. Pricing

| Tier | Price | Included | Target buyer |
|---|---|---|---|
| **Pilot** | ₹4L / 8 weeks | 1 integration, up to 10k verdicts, benchmark report, success criteria | All new accounts; credited against year one |
| **Standard** | ₹24L/yr | 120k verdicts/yr, API, case workflow, email support | PAs, fintechs, SFBs |
| **Growth** | ₹40L/yr | 300k verdicts/yr, SSO, priority support, quarterly benchmark review | Private banks, large NBFCs |
| **Enterprise** | ₹75L+/yr | 800k+ verdicts, VPC/on-prem, SLA 99.9%, named support | Banks, telcos |
| **Overage** | ₹12/verdict | Beyond included volume | All tiers |
| **Pattern feed** | ₹10L/yr add-on | Aggregated campaign/indicator intelligence | Existing accounts |
| **White-label portal** | ₹25L/yr + ₹10L implementation | Bank- or telco-branded consumer check | Banks, telcos |

### Why this shape

- **Paid pilots are non-negotiable.** A free pilot has no internal sponsor, no budget line and no
  urgency. ₹4L is small enough to approve without procurement and large enough to create
  commitment. Crediting it against year one removes the objection.
- **Priced per verdict, sold per year.** Institutions budget annually but consume variably.
  Fixed fee plus overage keeps the contract simple and protects margin on heavy users.
- **The add-ons are where the multiple lives.** Pattern feed and white-label are near-zero
  marginal cost and turn a per-seat tool into infrastructure.
- **No per-analyst pricing.** It penalises adoption inside the buyer, which is the opposite of
  what a land-and-expand strategy needs.

---

## 2. Unit economics per account

Assumptions: 60% cache hit rate; deterministic run ₹0.10; hybrid run ₹2.50; ~35% of full pipeline
runs invoke the LLM (the rest resolve deterministically); support at ₹24L fully-loaded per FTE per
year.

| Line | Standard (₹24L) | Growth (₹40L) | Enterprise (₹75L) |
|---|---|---|---|
| Annual verdicts | 120k | 300k | 800k |
| Full pipeline runs/mo | 4,000 | 10,000 | 27,000 |
| Inference cost/yr | ₹0.41L | ₹0.98L | ₹2.7L |
| Infra allocation/yr | ₹1.2L | ₹2.0L | ₹4.0L |
| Support allocation/yr | ₹3.6L | ₹7.2L | ₹12.0L |
| **COGS** | **₹5.2L** | **₹10.2L** | **₹18.7L** |
| **Gross margin** | **78%** | **75%** | **75%** |

**Blended GM target: 76% at Phase 2, 80%+ by Phase 4** as cache hit rate improves and support
is amortised across more accounts.

### The lever that matters

Cache hit rate is the entire margin story:

| Cache hit rate | Inference cost/yr (Standard) | GM |
|---|---|---|
| 30% | ₹0.82L | 74% |
| 60% | ₹0.41L | 78% |
| 80% | ₹0.20L | 80% |

Scam campaigns are repetitive by nature — the same fake-customer-care script reaches thousands
of people. Every improvement in indicator matching is a direct margin gain, and it compounds as
the corpus grows. Competitors calling a model per request cannot follow.

### LTV and payback

| Metric | Standard account |
|---|---|
| ACV | ₹24L |
| Gross profit/yr | ₹18.7L |
| Assumed account life | 5 years (conservative; integration creates stickiness) |
| **LTV** | **₹93L** |
| CAC (founder-led, fully loaded) | ₹2.5–4L |
| **LTV : CAC** | **23–37×** |
| Payback | < 3 months |

These are healthy enterprise numbers and are exactly why this motion is worth the procurement
pain. They also set a trap: enterprise economics make it tempting to chase a single large logo
for a year. Do not.

---

## 3. The pipeline arithmetic that constrains the plan

This is the most important operational calculation in the document.

| Input | Value |
|---|---|
| Addressable accounts | 74 |
| Qualified opportunities per year (founder-led) | ~18–20 |
| Close rate on qualified | 35–40% |
| **Accounts per year from founder-led sales** | **~7** |

The base case in [02](02-MARKET-AND-COMPETITION.md) needs **8 accounts by month 12 and 24 by month
24** — roughly one new logo per month in year one, then about four per quarter. Founder-only
selling produces about 7.

**Therefore the base case requires one of:**

1. **A second seller** (AE or SDR, ₹12–18L/yr) from month 10, or
2. **A channel partner** producing qualified pipeline by month 14, or
3. **A lower close-rate assumption accepted** with a smaller base case (~14 accounts, ₹4Cr ARR).

This is not a footnote. It is the difference between the base case and the conservative case,
and it should be budgeted in Phase 2 rather than discovered in Phase 3. Note that a ₹15L seller
is justified by a single additional ₹24L account.

---

## 4. Cost of the two-sided motion

| Cost centre | Consumer wedge | Institutional |
|---|---|---|
| Inference | ~₹0.02/check (60%+ cache hits) | ₹3–4/verdict average |
| Infra | Scale with checks, not users | Per tenant |
| Support | Automated only; no human queue | Named contact, business hours |
| Acquisition | Organic (WhatsApp, SEO, press) | Founder/partner-led |

**Consumer is budgeted as marketing, not as a P&L.** At 5M checks/year the inference cost is
~₹1L — cheaper than a single trade-show booth, and it produces the corpus and the inbound
pipeline. Judge it on checks, shares, press and inbound institutional leads, never on consumer
subscription revenue.

---

## 5. Sales motion

### The playbook

| Stage | Action | Asset |
|---|---|---|
| Trigger | Regulatory finding, fraud incident, new product launch, DPDP programme | Monitoring of RBI/SEBI circulars and news |
| First touch | Founder email referencing the specific trigger + the benchmark | One-page teaser |
| Discovery (45 min) | Quantify cases/month, analyst minutes/case, current tooling, compliance constraints | Discovery script |
| Technical validation | 50 real (redacted) cases run through the API; compare against their dispositions | Benchmark comparison sheet |
| Paid pilot | 8 weeks, fixed scope, success criteria in writing | Pilot SOW |
| Conversion | Pilot results → annual contract | Case study + ROI calculator |

**The technical validation step is the close.** Running their own historical cases and showing
agreement (or honest disagreement) with their analyst dispositions converts scepticism into
evidence faster than any deck.

### Objection handling

| Objection | Response |
|---|---|
| "We already have transaction monitoring." | We read the narrative it cannot — the message the customer received. Complementary, not replacing. |
| "How do we know it is accurate?" | Here is the benchmark, its methodology, and the categories where it is weakest. |
| "What if it says safe and we lose money?" | It never says safe. Every verdict states coverage and confidence; the decision stays with your team. |
| "Data cannot leave our environment." | VPC deployment, no outbound raw data, air-gapped deterministic mode. |
| "You are too small." | Paid pilot, exit clause, escrow of the ruleset, and a named engineer on the account. |
| "Procurement takes 9 months." | Pilot can run under a services agreement in 3 weeks; production contract follows. |

---

## 6. Channels, sequenced

| Phase | Channel | Expected contribution |
|---|---|---|
| 1 | Founder network + direct outbound to PAs/fintechs | 100% |
| 2 | Consumer wedge inbound + benchmark report | 15–20% of pipeline |
| 3 | System integrators (Infosys, TCS, Wipro, Maveric, Nelito) | 20–30% of pipeline |
| 4 | Channel-led + MENA/SEA lighthouse | 30–40% |

**Channel economics:** SI partners take 15–25% of contract value and control the relationship.
Accept it for tier-2/3 banks where direct reach does not exist; never for the first ten accounts,
where the learning matters more than the logo.

---

## 7. Consumer wedge economics

| Metric | Target |
|---|---|
| Cost per check | < ₹0.05 at 60% cache |
| Checks/month by month 12 | 400k |
| Second-check rate (14 days) | ≥ 25% |
| Share rate | ≥ 12% of completed checks |
| Institutional inbound attributed to wedge | ≥ 20% of qualified pipeline by Phase 2 |

**Monetisation:** ₹79/month Pro (unlimited checks, saved history, alerts) — expected to convert
under 1%. That is fine. The wedge is judged on distribution and corpus, and any revenue is
incidental.

---

## 8. Expansion and retention

| Lever | Mechanism | Effect |
|---|---|---|
| Volume growth | Pricing per verdict means usage expansion is automatic | NRR 110%+ |
| Pattern feed upsell | ₹10L add-on after 6 months of usage | +40% ACV |
| White-label portal | Consumer-facing brand surface for the bank | +₹25L |
| Additional use cases | Merchant onboarding checks, complaint triage, employee phishing | +1–2 departments |
| Multi-entity | Group banks roll out subsidiary by subsidiary | 2–3× contract |

**Churn defence:** the integration and the disposition history create switching costs. Document
both in the contract's exit clause — a buyer who knows exit is possible is more willing to
enter.

---

## 9. Break-even

| Fixed monthly cost | Amount |
|---|---|
| Two engineers | ₹3.5L |
| Infra + tooling | ₹0.5L |
| Compliance amortised | ₹0.4L |
| GTM (travel, events) | ₹0.6L |
| **Total** | **~₹5.0L/month (₹60L/yr)** |

At 76% GM, break-even is **₹6.6L/month revenue ≈ ₹79L ARR ≈ 4 standard accounts.**

That is the strategic safety net: four accounts and the company is cash-neutral. It means the
business never *has* to accept a bad acquisition price, and it is the single strongest argument
for the institutional-first motion.
