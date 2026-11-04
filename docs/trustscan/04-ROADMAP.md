# 04 — Roadmap & Gates

## 1. Structure

Six phases over 24 months. Every phase ends in a **gate** with measurable thresholds and an
explicit **kill criterion**. A missed gate triggers a stop-and-re-decide, not an extension.

Assumed resourcing: a technical founder full-time, plus one engineer from month 6 and
contracted design/security as needed. Costs are in INR, excluding founder compensation.

| Phase | Weeks | Objective | Exit gate | Kill criterion |
|---|---|---|---|---|
| **0 — Positioning** | 0–6 (mo 0–1.5) | Prove someone will pay before building anything | 1 signed paid pilot; 15 discovery calls; benchmark v1 published | No paid pilot by week 6 ⇒ wrong buyer or wrong pitch |
| **1 — Wedge & API** | 6–20 (mo 1.5–5) | Ship the consumer wedge and the institutional API | 10k consumer checks; API v1 live; pilot in production; precision ≥ 0.85 | Precision < 0.75 ⇒ engine is not institutional-grade; stay consumer |
| **2 — Revenue** | 20–52 (mo 5–12) | Repeatable sales + case workflow | ₹2.1Cr ARR ($250k); 8 accounts; GM ≥ 70%; 5k labelled dispositions | < ₹85L ARR ($100k) ⇒ sales motion wrong |
| **3 — Enterprise** | 52–78 (mo 12–18) | Certifications, VPC deployment, partner channel | ₹5Cr ARR ($600k); 20 accounts; VPC live; ISO 27001 audited | No VPC deal ⇒ re-scope to fintech/PA only |
| **4 — Platform** | 78–100 (mo 18–23) | Channel leverage + pattern feed as a product | ₹8Cr ARR ($940k); 2 SIs producing 30% of new logos | Channel < 15% of pipeline ⇒ direct-only, extend 6 months |
| **5 — Readiness** | 78–104 (mo 18–24) | Diligence-grade company | ₹9–11Cr run-rate; data room; 3 buyer conversations | No buyer interest ⇒ extend to 30 months, cut burn |

**Calendar note.** Phase 5 workstreams start at week 78 in parallel with Phase 3–4 delivery, because
diligence hygiene cannot be added at the end. The gates above are the milestones in
[README.md](README.md): $250k ARR at month 12, $600k at month 18, and $0.8–1.8M at month 24. They
are **targets on the funded path**, not the base case; [02](02-MARKET-AND-COMPETITION.md) §3 models
a base case that trails Phase 4 by roughly one quarter.

---

## 2. Phase 0 — Positioning and first money (weeks 0–6)

**Why this phase exists:** enterprise products die from building for 12 months and then
discovering the buyer wanted something else. Six weeks of selling before building is the
cheapest insurance in the plan.

**Work**

1. **Account list.** 74 named accounts with segment, ACV band, buying-centre contacts and
   trigger events. This list *is* the market model; if it cannot be built, the segmentation in
   [02](02-MARKET-AND-COMPETITION.md) is wrong.
2. **15 discovery calls** with Head of Fraud Risk / CISO / Head of Digital across PAs, fintechs,
   SFBs and one private bank.
3. **Benchmark v1.** Expand the existing evaluation set from 20 cases to 300 hand-labelled
   Indian cases (SMS, WhatsApp, email, screenshots, UPI collect-request scams, fake customer
   care, KYC-update, electricity-bill, part-time-job, digital-arrest). Publish precision,
   recall and failure modes.
4. **Pilot offer.** 8 weeks, ₹4L, fixed scope, one integration, success criteria agreed in
   writing. A paid pilot is the only discovery output that counts.
5. **Reality check on certifications.** Get two quotes for ISO 27001 and VAPT so Phase 3
   budgeting is real, not aspirational.

**Exit gate:** one signed paid pilot; benchmark published; account list complete.

**Kill criterion:** no institution will pay for a pilot. That means the pain is not budgeted, or
we are talking to the wrong role. Response: run a 3-week diagnostic with 10 more calls at a
different seniority or segment before writing any code.

---

## 3. Phase 1 — Wedge and API (weeks 6–20)

**Objective:** put something in front of the market that acquires users and something in front
of the pilot that proves the engine.

**Build**

| Item | Reuse | Effort |
|---|---|---|
| Institutional API v1 (single + batch, keys, quotas, idempotency) | `api/investigations` patterns, `core/rate_limit` | 3 weeks |
| Org + membership + RBAC | New | 3 weeks |
| Consumer check refresh + public report pages | Existing web app | 2 weeks |
| WhatsApp forward-to-check bot | New (BSP integration) | 3 weeks |
| Verdict store + indicator cache | New | 2 weeks |
| Indian signal set (UPI handles, fake customer-care numbers, KYC/BEC patterns, Hinglish normalisation) | `url_intelligence`, `evidence_extractor` | 4 weeks |
| Benchmark harness in CI | Existing 20-case test | 2 weeks |
| Pilot integration support | — | ongoing |

**Design decision:** the API contract is frozen at the end of this phase. Changing it after a
bank has integrated is expensive in trust, not just time.

**Exit gate**
- 10,000 consumer checks completed
- API v1 in production at one institution
- Precision ≥ 0.85 and recall ≥ 0.80 on the 300-case benchmark
- p50 latency < 800 ms deterministic
- WhatsApp bot retention: ≥ 25% of users send a second message within 14 days

**Kill criterion:** precision < 0.75. An institutional product that is wrong one time in four
is unsellable, and no amount of UI fixes that. Response: restrict to the categories where
precision is high, and widen only when the benchmark supports it.

---

## 4. Phase 2 — Revenue and workflow (weeks 20–52)

**Objective:** convert pilot interest into a repeatable motion with a product analysts actually
use.

**Build**

| Item | Why |
|---|---|
| Case workflow (queue, assign, disposition, export) | Without it, we sell an API and the buyer still triages by hand |
| Compliance evidence export | The artefact that turns a pilot into a renewal |
| Disposition → labelled data pipeline | Turns customer work into our benchmark |
| Second and third pilot conversions | Repeatability, not novelty |
| Metering + invoicing + GST | Cannot invoice without it |
| VAPT + cyber-liability insurance | Procurement blockers otherwise |

**Sales target:** 8 accounts by month 12 — the converted Phase 0 pilot plus roughly one new logo
per month from month 7. This requires the second seller from [05](05-ECONOMICS-AND-GTM.md) §3.

**Exit gate**
- ₹2.1Cr ARR (~$250k)
- 8 paying institutional accounts
- Gross margin ≥ 70%
- ≥ 5,000 dispositions recorded (the corpus begins here)
- ≥ 2 tenants using case workflow daily
- Net revenue retention ≥ 110% on the first cohort

**Kill criterion:** < ₹85L ARR. Either the price is wrong, the buyer is wrong, or the product is
not saving measurable analyst time. Diagnose in that order; do not hire salespeople to fix a
product problem.

---

## 5. Phase 3 — Enterprise readiness (weeks 52–78)

**Objective:** become buyable by a bank, not just by a fintech.

**Build**

| Item | Why |
|---|---|
| VPC / single-tenant deployment profile | Many regulated entities will not accept shared SaaS |
| Air-gapped deterministic mode + offline corpus sync | Same reason; also a differentiator |
| SSO (SAML/OIDC) | Standard enterprise gate |
| ISO 27001 certification | Removes the longest procurement objection |
| Ruleset release process + verdict diff tooling | Governance question every bank asks |
| Pattern feed v1 (aggregated, privacy-preserving) | The corpus becomes a product |
| SI partner enablement pack | Channel begins here |

**Exit gate**
- ₹5Cr ARR (~$600k), 20 accounts
- One VPC deployment live and in production
- ISO 27001 audited (not "in progress")
- 2 SI partnerships signed with a defined referral motion
- Pattern feed adopted by ≥ 3 tenants

**Kill criterion:** no institution will accept a VPC deal. Response: re-scope to PAs, fintechs
and SFBs only. That is still a viable $1M ARR business and an acquirable asset — it simply
caps the ceiling, and the plan should be re-cut rather than extended.

---

## 6. Phase 4 — Platform leverage (weeks 78–100)

**Objective:** growth that does not scale linearly with founder hours.

| Workstream | Target |
|---|---|
| SI channel | 2 partners producing ≥ 30% of qualified pipeline |
| Pattern feed as standalone subscription | ₹8–15L/yr add-on to existing accounts |
| White-label protection portal | 2 telco/bank deployments |
| Expansion into MENA / SEA | 2 lighthouse accounts only; no broad push |
| Public benchmark report (quarterly) | Category authority; inbound lead source |

**Exit gate:** ₹8Cr ARR (~$940k); channel ≥ 30% of new logos; ≥ 5 feed subscribers.

---

## 7. Phase 5 — Acquisition readiness (weeks 78–104, parallel)

Full detail in [06](06-INVESTOR-AND-ACQUISITION-READINESS.md). Workstreams: financial hygiene,
IP and trademark cleanliness, data and consent documentation, frozen metric definitions, buyer
outreach. These start in week 78, alongside Phase 4, so that the data room is populated from
real operating records rather than reconstructed at the end.

**Exit gate:** data room complete and counsel-reviewed; 3 buyer conversations; ₹9–11Cr run-rate
(roughly $1.1–1.3M), with a credible path to the ₹12Cr+ trajectory.

---

## 8. Instrumentation — build in Phase 0

| Metric | Definition (freeze this) |
|---|---|
| Verdict precision | Correct fraud verdicts ÷ all fraud verdicts, on the labelled set |
| Verdict recall | Fraud cases correctly flagged ÷ all fraud cases in the set |
| Cache hit rate | Requests served without a full pipeline run ÷ total |
| Cost per verdict | (LLM + infra) ÷ verdicts, per tenant |
| Analyst minutes saved | Baseline triage time − post-deployment time, measured with 2 pilot customers |
| ARR | Contracted annual value, normalised monthly, excluding one-off pilot fees |
| Gross margin | (Revenue − inference − infra − support) ÷ revenue |
| Net revenue retention | Cohort ARR at month 12 ÷ initial ARR |

**`analyst minutes saved` is the single most important commercial metric.** It is the number
that justifies renewal, and the number an acquirer will use to model the product's value inside
their own customer base.

---

## 9. First 90 days

| Week | Deliverable |
|---|---|
| 1 | Account list v1 (74 names); discovery script; pilot offer drafted |
| 2 | 5 discovery calls; benchmark case collection begins |
| 3 | 10 discovery calls; API contract drafted; WhatsApp BSP selected |
| 4 | 15 calls complete; pilot proposal out to 3 accounts; benchmark at 150 cases |
| 5 | Benchmark at 300 cases, published internally; API v1 skeleton |
| 6 | **Phase 0 gate** — paid pilot signed or diagnostic sprint |
| 7–9 | Org/RBAC; API keys and quotas; verdict store |
| 10–12 | Indian signal set; batch endpoint; webhook delivery |
| 13–15 | WhatsApp bot build and pilot with 100 users |
| 16–20 | Pilot integration complete; benchmark at 300 cases; **Phase 1 gate (week 20)** |

The 90-day window covers weeks 1–13; the Phase 1 gate sits at week 20 by design, because the
pilot needs a full quarter in production before the accuracy threshold means anything.

**If the Phase 0 gate fails,** do not build. Run three more weeks of discovery at a different
segment — payment aggregators if you were calling banks — then re-gate once. The whole point of
this sequencing is that the expensive mistake is discovered for ₹2L instead of ₹40L.

---

## 10. Cost envelope

| Phase | Infra | Inference | People (contracted) | Compliance/legal | Total |
|---|---|---|---|---|---|
| 0 | ₹30k | ₹0 | ₹1.0L | ₹70k | **₹2.0L** |
| 1 | ₹1.2L | ₹60k | ₹4.0L | ₹40k | **₹5.8L** |
| 2 | ₹2.4L | ₹2.0L | ₹12.0L | ₹2.5L | **₹18.9L** |
| 3 | ₹5.0L | ₹5.0L | ₹24.0L | ₹11.0L | **₹45.0L** |
| 4 | ₹8.0L | ₹9.0L | ₹36.0L | ₹7.0L | **₹60.0L** |
| 5 | ₹6.0L | ₹8.0L | ₹16.0L | ₹15.0L | **₹45.0L** |
| | | | | | **≈ ₹1.77Cr (~$208k)** |

**Funding options**, stated honestly:

- **Bootstrapped:** feasible only if Phase 2 revenue (₹2.1Cr ARR) is reached before Phase 3
  spend. That requires the first two accounts to land by month 9. Slower, but retains control
  and is the better outcome if it works.
- **Small angel/seed round:** ₹1.5–3Cr at ₹12–20Cr valuation, timed to a signed pilot and the
  benchmark. Buys Phase 3 without stretching.
- **Revenue-based financing:** viable once ARR exceeds ₹3Cr with low churn; expensive otherwise.

The plan is designed so that Phase 2 revenue can fund Phase 3. If it cannot, that fact is
itself the signal.

---

## 11. What would make this roadmap wrong

| Assumption | If false | Response |
|---|---|---|
| Institutions will pay for a pilot | Pilot conversion stalls at 0 | Sell the benchmark report as a paid diagnostic; use it to earn the pilot |
| Analysts' time is the value driver | Buyers do not believe the ROI | Re-anchor on regulatory evidence and complaint resolution time |
| Precision ≥ 0.85 is achievable on Indian content | Benchmark plateaus at 0.7 | Narrow to high-precision categories (fake domains, known mule handles) and price per category |
| PAs and fintechs buy in 4–10 weeks | Cycles run 6 months | Extend Phase 2 by a quarter; do not cut price to compensate |
| A bank will accept VPC deployment | They demand on-prem with their own DB | Raise scope and price; or exit the bank segment entirely (re-plan Phase 3) |
| Two engineers are enough | Velocity halves | Extend timeline by 40%; protect Phase 0 and 1 gates, compress Phase 4 |
