# 06 — Investor & Acquisition Readiness

## 1. What "acquisition-ready" means here

For a B2B fraud-intelligence company, readiness is not "good product, growing revenue". It is
the state in which a strategic buyer can complete diligence in 60 days without a price
renegotiation. Five properties:

| Property | Test | Status today |
|---|---|---|
| **Clean ownership** | Every contributor assigned IP; trademark registered in India (class 9/42) | ❌ Not started |
| **Provable accuracy** | Published benchmark with methodology and known failure modes | ⚠️ 20-case harness exists; not credible yet |
| **Provable revenue** | 12 months of contracts, reconciled to bank statements and GST filings | ❌ Pre-revenue |
| **Contained risk** | No cross-tenant leakage, no unconsented data, no liability gaps | ⚠️ Architecture supports it; policy absent |
| **Referenceable customers** | Two accounts willing to take a diligence call | ❌ None |

Only the technology position is currently satisfied. The other four are the work of
[04](04-ROADMAP.md), and starting them late is the most common reason a ₹20Cr acquisition
becomes a ₹6Cr acqui-hire.

---

## 2. The metrics a buyer underwrites

| # | Metric | Why they care | Target at exit |
|---|---|---|---|
| 1 | **Precision / recall** by fraud category | They are buying accuracy they cannot build | Precision ≥ 0.85, recall ≥ 0.80 |
| 2 | **Analyst minutes saved per case** | The ROI their CFO will model | ≥ 40% reduction |
| 3 | **Logo retention** | Enterprise stickiness | ≥ 90% annually |
| 4 | **Net revenue retention** | Expansion inside accounts | ≥ 110% |
| 5 | **Gross margin** | Services masquerading as SaaS is discounted heavily | ≥ 78% |
| 6 | **Revenue concentration** | One account is a risk, not a business | No account > 25% of ARR |
| 7 | **Cache hit rate** | Structural margin, and a proxy for corpus value | ≥ 60% |

Metric 7 is unusual and worth explaining to a buyer: it is the clearest quantitative signal that
the pattern corpus is real and compounding. A competitor without a corpus runs near 0%.

---

## 3. Data room

### Corporate and legal
- Certificate of incorporation, MOA/AOA, board resolutions
- Cap table (fully diluted), ESOP scheme, any convertible instruments
- IP assignment from every founder, employee and contractor
- **Trademark registration** — verify "TrustScan" availability in India before filing; the mark
  is descriptive-adjacent and may be in use by other vendors in adjacent classes
- Open-source licence inventory (confirm no copyleft in shipped code)
- Customer contracts, DPAs, sub-processor list, SLAs

### Compliance
- DPDP Act 2023 readiness mapping: purpose, consent, retention, deletion, grievance officer
- RBI IT-outsourcing compliance pack: audit rights, exit clause, data localisation, BCP
- CERT-In: incident response runbook, 180-day log retention evidence
- ISO 27001 certificate (Phase 3) and latest VAPT report
- Cyber-liability insurance certificate

### Technical
- Architecture overview (this set, [03](03-PRODUCT-AND-ARCHITECTURE.md))
- Ruleset versioning and release process
- Benchmark dataset description, labelling methodology, limitations
- Tenant isolation tests and results
- Model dependency inventory with fallback behaviour and cost sensitivity
- Repository access and code provenance

### Commercial
- Pipeline by stage with source attribution
- Pilot-to-paid conversion rate and reasons for loss
- Churn reasons, coded
- Top 10 customer interviews (redacted)
- ROI model per account

### Data
- **Corpus documentation** — the centrepiece: indicator counts, coverage, freshness, labelling,
  aggregation method, privacy constraints
- Cross-tenant sharing policy and the technical enforcement of it

---

## 4. Diligence red flags to pre-empt

| Red flag | Why it kills or discounts a deal | Pre-emption |
|---|---|---|
| Accuracy claims without methodology | Signals a demo, not a product | Publish the benchmark and its failure modes |
| Cross-tenant data exposure | Ends enterprise trust instantly | Aggregate-only sharing, documented, tested |
| Consent basis for forwarded messages | DPDP exposure; messages contain third parties' data | Explicit purpose at collection; redaction; retention limits |
| Unregistered or conflicting trademark | Legal workstream fails in week one | File in Phase 0 |
| LLM vendor dependency | "This is a wrapper" discount | Deterministic core, air-gapped mode, model-agnostic router |
| Revenue concentration | Buyer prices in the risk | Diversify before outreach; disclose honestly if not |
| Liability for a false negative | Open-ended risk | "Never say safe", coverage fields, contractual caps, insurance |
| Undocumented ruleset changes | Cannot explain a historical verdict | Ruleset version recorded on every verdict |
| Founder-only sales | Growth is capped at the founder's calendar | Second seller or channel by Phase 3 |

---

## 5. Buyer map

Ranked by strategic fit, not size. For each: what they are actually buying.

| Tier | Buyer | Examples | What they buy | Rationale |
|---|---|---|---|---|
| **A** | Indian banking software / regtech | Clari5, Nelito, Maveric, Aurionpro, Intellect Design | Product + corpus + BFSI references | They have the bank relationships but a dated rules-based stack; this is a direct capability upgrade |
| **A** | Indian IT services | Infosys (Finacle), TCS, Wipro, HCLTech, Tech Mahindra | Product IP + domain team | They sell BFSI transformation but own no fraud product; this becomes a repeatable offering with their distribution |
| **A** | Indian KYC / identity | Perfios, Signzy, IDfy, HyperVerge, Bureau | Content-adjudication layer | Adjacent problem, same buyers; buys them a new module without building a pipeline |
| **B** | Global fraud platforms | Featurespace (Visa), Feedzai, NICE Actimize, Sardine, Alloy, Unit21 | India corpus + localisation + APAC entry | They have capability but weak India content; this is the fastest way to localise |
| **B** | Indian payments | Razorpay, PhonePe, Paytm, Cashfree, BillDesk | Loss reduction + a differentiated trust feature | Consumer trust is their growth constraint |
| **B** | Risk data and bureaus | LexisNexis Risk, Experian, TransUnion CIBIL | Indicator corpus | Data businesses buy datasets that are hard to assemble |
| **C** | Telecom | Jio, Airtel, Vi | Smishing defence at scale | Regulatory pressure on fraud communications; large but slow |
| **C** | Global cyber vendors | Palo Alto, Fortinet, Cloudflare (email/web security) | India content + team | Adjacent, plausible, lower urgency |

**Outreach strategy:** founder-led, 4–6 targets per tier, warm introductions preferred, timed to
a public milestone — a published quarterly scam report, a large logo, or the ISO 27001
certificate. No mass-blast banker process at this revenue scale; it leaks information and
depresses price.

---

## 6. Valuation logic

Small Indian B2B SaaS trades on ARR multiples adjusted for retention, margin and concentration.
Strategic buyers add a premium for capability and corpus.

| Basis | Multiple | Requirements |
|---|---|---|
| Acqui-hire | — | Team + IP; revenue optional |
| B2B SaaS, average metrics | 3–4× ARR | $300k–$1M ARR, clean books |
| B2B SaaS, strong retention | 5–6× ARR | Logo retention ≥ 90%, NRR ≥ 110%, GM ≥ 78% |
| Strategic capability premium | +2–3× | Corpus is demonstrably unique and transferable |
| Strategic platform premium | 8–10× | $1.5M+ ARR + channel + institutional references |

### Worked ranges (contingent, not promised)

| Outcome | ARR at exit | Implied value |
|---|---|---|
| Plan stalls, team and IP only | — | **₹6–12Cr** (~$0.7–1.4M) acqui-hire |
| Conservative at 24 months | $280k | **₹7–10Cr** ($0.8–1.2M) |
| **Base at 24 months** | **$840k** | **₹22–35Cr** ($2.6–4.1M) |
| Upside at 24 months | $1.79M | **₹50–75Cr** ($5.9–8.8M) |
| Platform, 30–36 months | $2.5M+ | **₹90–130Cr** ($10.6–15.3M) |

Acqui-hire is priced on team and IP rather than ARR, which is why it can exceed a low-ARR
outcome. The other rows are ARR × a multiple from the bands above: conservative 3–4×, base
3–5×, upside 3.3–5×, platform 4–6×. The 8–10× platform premium is only achievable in a
competitive process at $2.5M+ ARR with channel revenue — treat it as the ceiling, not the plan.
At $280k, the conservative line therefore resolves to ₹7–10Cr, not the ₹9–13Cr a napkin estimate
would suggest.

The honest read: **the base case is a ₹22–35Cr acquisition.** That is a genuinely good outcome
for a bootstrapped Indian company, and it does not require heroics — it requires 24 accounts,
clean books, and a corpus a buyer cannot replicate.

Do not plan on the $15M outcome. Plan on the base case; treat upside as a consequence.

---

## 7. Deal structure expectations

| Element | Typical | Notes |
|---|---|---|
| Cash at close | 70–85% | Indian strategic deals are cash-heavy relative to US PE deals |
| Earn-out | 15–30%, 12–18 months | Tied to revenue retention or accuracy SLA, not to headcount |
| Escrow | 10–15%, 12–18 months | Standard; budget for it |
| Founder retention | 12–24 months | Usually required; negotiate a defined role and reporting line |
| Key-employee retention | 12 months | Protects the corpus and the ruleset knowledge |

---

## 8. Alternatives to selling

| Alternative | When right | Economics |
|---|---|---|
| **Stay independent** | Break-even at 4 accounts; founder wants control | ₹1.5–4Cr/yr profit at 20 accounts |
| **Seed / angel round** | Pilot signed, benchmark credible, need Phase 3 capital | ₹1.5–3Cr at ₹12–20Cr valuation |
| **Revenue-based financing** | ARR > ₹3Cr, low churn, no dilution desired | 1.2–1.5× repayment over 24 months |
| **Asset sale (IP + corpus only)** | Team wants out, product still valuable | ₹4–8Cr |

The break-even point at **four institutional accounts** is the strategic asset here. It means
the company is never forced to sell, which is precisely what makes a good price achievable.

---

## 9. Readiness calendar

| Month | Milestone | Deliverable |
|---|---|---|
| 1 | Ownership | IP assignments signed; trademark search and filing started |
| 4 | Accuracy | Benchmark at 300 cases, published methodology |
| 6 | First revenue | Pilot converted; contract, DPA, invoice trail |
| 9 | Compliance | DPDP mapping complete; VAPT done; insurance bound |
| 12 | Metrics frozen | Definitions in repo; dashboard reconciled to books |
| 15 | Corpus memo v1 | Coverage, labelling, privacy enforcement |
| 18 | ISO 27001 | Audited certificate |
| 20 | Data room v1 | All sections populated, gaps listed |
| 21 | Counsel review | Legal, IP and contract workstreams cleared |
| 22 | Buyer outreach | 4–6 conversations opened per tier |
| 24 | Close or extend | Term sheet, or continue with leverage |

---

## 10. The number that decides the multiple

**Cache hit rate.** It is the one metric that simultaneously proves the corpus is real, the
margin is structural, and the moat compounds with every new customer. A buyer will model it
across their own customer base within a week of seeing it.

A company at 60% cache hit with 24 accounts is infrastructure. A company at 5% is an API
wrapper with a support cost. The difference is not in the pitch — it is in the engineering, and
it is measurable.
