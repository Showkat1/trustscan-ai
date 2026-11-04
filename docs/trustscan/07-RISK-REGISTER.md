# 07 — Risk Register

## 1. Register

Scored L × I, 1–5. L×I ≥ 12 is board-level.

| # | Risk | L | I | Score | Mitigation | Tripwire |
|---|---|---|---|---|---|---|
| **R1** | **Nobody pays.** Institutions evaluate, admire, and never sign | 3 | 5 | **15** | Paid pilots only; PA/fintech segment first; discovery before build | Zero paid pilots by week 6 |
| **R2** | **Accuracy insufficient on Indian content** — Hinglish, regional scripts, novel campaigns | 4 | 5 | **20** | 300→2,000 case benchmark; category-level precision; refuse to guess | Precision < 0.80 at week 20 |
| **R3** | **False negative causes a loss** — a customer is defrauded after a "no evidence" verdict | 3 | 5 | **15** | Never say "safe"; coverage fields; human decision retained; caps + insurance | Any complaint attributing a loss to our verdict |
| **R4** | **Sales cycle exceeds runway** — enterprise procurement stalls | 4 | 4 | **16** | Land with fintechs/PAs; services agreement for pilots; break-even at 4 accounts | No contract by month 9 |
| **R5** | **DPDP non-compliance** — consent basis, retention, third-party PII in forwarded messages | 3 | 4 | 12 | Consent at collection, redaction, retention limits, DPO, documented mapping | Any data-principal request that cannot be served |
| **R6** | **Cross-tenant leakage** — one bank's cases visible to another | 2 | 5 | 10 | Aggregate-only sharing; row-level scoping; isolation tests in CI | Any isolation test failure |
| **R7** | **Certification gap blocks procurement** — ISO 27001, VAPT, insurance demanded early | 4 | 3 | 12 | Start Phase 2 not Phase 3; budgeted; use certificates as a sales asset | Two deals stalled solely on certification |
| **R8** | **Incumbent bundles a competing module for free** — Perfios/Signzy/Clari5 add "scam check" | 3 | 4 | 12 | Depth of corpus and explainability; integrate rather than compete where possible | A vendor announcement of a similar module |
| **R9** | **Global vendor localises India** — Featurespace/Feedzai ship Indian content | 2 | 4 | 8 | Speed, local language, and price point; win the fintech segment first | A global vendor announcement naming India |
| **R10** | **Model cost or policy shock** | 2 | 3 | 6 | Deterministic core; caching; model-agnostic routing; air-gapped mode | Inference cost > 15% of revenue |
| **R11** | **Founder is the entire sales team** | 4 | 3 | 12 | Second seller or channel by month 10; documented playbook | Pipeline stalls during any founder absence |
| **R12** | **Trademark conflict on "TrustScan"** | 3 | 3 | 9 | Search class 9/42 in India before filing; fallback marks prepared | Search returns a live mark in the same class |
| **R13** | **Regulatory change restricts data sharing or cross-tenant aggregation** | 2 | 4 | 8 | Aggregate-only architecture; legal review of DPDP rules as notified | Draft rules limiting cross-entity sharing |
| **R14** | **Client concentration** — one account > 30% of ARR | 3 | 3 | 9 | Cap concentration in the plan; diversify before buyer outreach | Any single account > 30% |
| **R15** | **WhatsApp platform policy change** — BSP restrictions on forwarded-content processing | 3 | 3 | 9 | Multi-channel from day one (web, SMS, Telegram); bot is a channel, not the product | Any policy notice from the BSP |

---

## 2. The three that actually decide the outcome

### R2 — Accuracy on Indian content (highest score)

This is the real technical risk, and it is underestimated by almost every founder entering the
space. Generic models handle clean English SMS well. They degrade sharply on:

- Hinglish and transliterated Hindi ("aapka account block ho jayega")
- Regional scripts and mixed-script text
- Voice-note transcripts and screenshot-only evidence
- Campaigns that rotate domains every 48 hours
- Polite, well-written fraud that mimics legitimate bank tone

The mitigation is not a better model. It is a **category-level benchmark** and the discipline to
refuse categories where precision is weak. Selling five categories at 0.92 precision beats
selling twenty at 0.71, because one public false negative costs more than ten quiet wins.

### R4 — Sales cycle versus runway

Indian enterprise procurement is slow, and the plan's first revenue milestone sits at month 6–9.
If the first contract lands at month 14, the company is out of money before the motion is
proven. Mitigations are structural: sell to PAs and fintechs (4–10 weeks), run pilots under a
services agreement rather than a procurement process, and keep fixed costs at the ₹5L/month
level until ARR covers them.

### R3 — False negative

Every fraud-detection product eventually misses a case that matters, and the customer will
remember who told them it looked fine. The defence is architectural and contractual:

- The output vocabulary never includes "safe" — only "no evidence of fraud found" with an
  explicit coverage statement.
- Low-confidence verdicts are surfaced, not averaged away.
- No automated blocking; the regulated entity decides.
- Contractual liability cap, cyber-liability cover, and an incident playbook written before it
  is needed.

---

## 3. Tripwires

| Tripwire | Interpretation | Response |
|---|---|---|
| < 5 of 15 discovery calls identify a budgeted owner | Pain is real but unfunded | Change segment (PA → NBFC) or change buyer role |
| Pilots convert at < 30% | Product works but does not fit the workflow | Build the case workflow earlier; re-scope pilot success criteria |
| Analysts override > 40% of verdicts | Accuracy or trust problem | Stop selling; benchmark and fix categories |
| Support tickets > 1 per 1,000 verdicts | Integration or UX is broken | Freeze features until resolved |
| Cache hit < 25% after 6 months | Corpus is not compounding | Invest in indicator normalisation; it is the margin and the moat |
| Time-to-first-verdict > 2 weeks for a new tenant | Integration is too hard | Ship an SDK and a sandbox; this is a churn predictor |

---

## 4. Kill and pivot conditions

| Condition | Decision |
|---|---|
| No paid pilot by week 6 | Do not build. Re-run discovery in a different segment for 3 weeks |
| Precision < 0.75 by week 20 | Retreat to high-precision categories only; drop the institutional API from the near-term plan |
| < ₹85L ARR by week 52 | Diagnose price → buyer → product, in that order; do not hire sales |
| No VPC deal accepted by week 78 | Re-scope to PAs/fintechs/SFBs; re-plan the exit at a lower ceiling |
| Any confirmed cross-tenant leak | Stop all growth; remediate; disclose to affected tenants before resuming |
| Runway < 6 months and no gate met | Wind down or acqui-hire; do not raise to cover a structural problem |

---

## 5. Anti-goals

- **Do not become a KYC vendor.** Adjacent, crowded, and it dilutes the only thing that makes
  us distinct.
- **Do not sit in the payment authorisation path.** It multiplies latency requirements and
  liability for no additional revenue.
- **Do not sell services.** A managed fraud desk triples revenue per deal and halves the
  multiple.
- **Do not chase a public sector bank before month 18.** An 18-month cycle at the wrong moment
  is fatal.
- **Do not ship a verdict without coverage fields.** One "looks safe" screenshot is a permanent
  brand asset for a competitor.
- **Do not let a single account exceed 30% of ARR** without a written plan to dilute it.

---

## 6. Residual risk statement

After mitigation, three risks remain irreducible:

1. **Indian language content is genuinely hard.** Mitigated by category discipline and a growing
   labelled corpus, not eliminated.
2. **Procurement timing is outside our control.** Mitigated by selling to faster segments first
   and by keeping break-even at four accounts.
3. **A single high-profile false negative could define the brand.** Mitigated by vocabulary,
   coverage disclosure, and contract structure — but never fully.

These are the questions a serious acquirer will ask. The correct answer is not to claim they are
solved, but to show the benchmark, the tripwires, and the evidence that the company measures
itself honestly. That posture is itself part of what is being bought.
