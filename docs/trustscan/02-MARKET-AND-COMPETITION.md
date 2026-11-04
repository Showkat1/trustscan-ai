# 02 — Market & Competition

## 1. The buyer, defined precisely

"Institutions" is not a segment. The initial customer is defined narrowly because the sales
cycle, the security bar and the contract size differ by an order of magnitude across it.

| Segment | Accounts in India | Typical ACV | Sales cycle | Why they buy |
|---|---|---|---|---|
| **Payment aggregators / PGs** | ~50 authorised | ₹18–30L | 4–10 weeks | Chargeback and merchant-fraud exposure; small fraud teams; API-native buyers |
| **Fintechs / neobanks** | 200+ | ₹18–30L | 6–12 weeks | Customer trust is the product; fraud is an existential brand risk |
| **Small finance banks (SFBs)** | ~12 | ₹25–40L | 3–5 months | Growing fast, thin fraud teams, regulator attention |
| **Co-operative / regional banks** | 1,500+ (long tail) | ₹10–20L | 3–6 months | Almost no tooling; price-sensitive; good for channel distribution |
| **Private banks** | ~21 | ₹40–75L | 6–9 months | Volume, brand exposure, existing vendor stack |
| **Public sector banks** | ~12 | ₹1–2Cr | 12–18 months | Mandate-driven, procurement-heavy, high reference value |
| **NBFCs** | ~9,000 (top 200 material) | ₹15–35L | 3–6 months | Digital lending fraud, RBI digital-lending rules |
| **Telecom operators** | 4 | ₹50L–1.5Cr | 9–12 months | Smishing at scale; regulatory pressure on fraud communications |
| **Marketplaces / e-commerce** | ~50 | ₹20–40L | 2–4 months | Buyer/seller fraud, fake support scams |

**Primary ICP for the first 12 months:** payment aggregators and fintechs. They buy fast, they
have an API culture, they carry real fraud losses, and a reference from one is worth more than
a logo from a PSB that took 18 months.

**Deliberately deferred:** the top four public sector banks. They are the best logos and the
worst first customers — an 18-month cycle at the start of a company is a death sentence.

---

## 2. Sizing — a bottom-up model, not a citation

| Layer | Assumption | Result | How to validate |
|---|---|---|---|
| Reachable accounts | Banks + PAs + relevant NBFCs + telcos + marketplaces addressable by a small team in 24 months | **~74** | Account list built in Phase 1, named, with contact |
| Blended ACV | Mix of PA/fintech/SFB at ₹22–30L, private banks at ₹50L+ | **₹28L (~$33k)** | First 3 signed contracts |
| Institutional ceiling | 74 × ₹28L | **₹20.7Cr (~$2.4M) ARR** | Sanity check against vendor revenues |
| Consumer revenue | 0.5% of 5M checks/mo × ₹79 | **~₹2.4Cr/yr** | Phase 2 conversion data |

**The honest read:** India-only institutional revenue tops out around **$2.5M ARR** on a
direct-sales motion. That is a real, sellable business — and it is *not* a $100M company. Any
plan that claims otherwise is either assuming expansion (MENA, SEA, UK) or assuming a consumer
miracle.

This matters for the exit thesis: **$600k–1.5M ARR in India is exactly the size at which
Indian IT services firms and global fraud vendors make acquisitions.** The ceiling is a feature
of the target, not a defect.

---

## 3. Scenario model

| Scenario | Institutional accounts (24 mo) | Institutional ARR | Consumer | Total ARR |
|---|---|---|---|---|
| Conservative | 10 | ₹2.2Cr (~$260k) | ₹15L | **~$280k** |
| **Base** | 24 | ₹6.7Cr (~$790k) | ₹40L | **~$840k** |
| Upside | 40 | ₹14Cr (~$1.65M) | ₹1.2Cr | **~$1.79M** |

Base case: 8 accounts by month 12 (the exit gate in [04](04-ROADMAP.md) Phase 2), then about four
new accounts per quarter through month 24, at a blended ₹28L ACV, with 15% annual expansion from
volume growth. That is 24 accounts and ₹6.7Cr institutional ARR — just under the Phase 4 gate of
₹8Cr, which is the intended relationship: the gates are funded-path targets, this is the number to
plan the business on. Conservative assumes a smaller-account mix (₹22L blended) and no expansion;
upside assumes a larger-account mix (₹35L blended) as private banks and telcos land.

The 8-accounts-by-month-12 step is the binding constraint, not the ARR. It requires roughly one new
logo per month from month 7, which founder-only selling cannot produce (see
[05](05-ECONOMICS-AND-GTM.md) §3). If the second seller is not hired on time, plan on the
conservative case.

---

## 4. Competitive map

| Vendor | Category | Strength | Weakness against us |
|---|---|---|---|
| **NICE Actimize** | Enterprise financial crime | Deepest compliance footprint, tier-1 trust | Priced for tier-1; heavy implementation; not built for narrative APP fraud in India |
| **Feedzai** | Real-time fraud ML | Strong transaction models, scale | Transaction-centric; needs structured event data, not a forwarded screenshot |
| **Featurespace (Visa)** | Adaptive behavioural analytics | Excellent for card/account behaviour | Behavioural, not content adjudication; not India-localised |
| **Sardine / Unit21 / Alloy** | Modern fraud & onboarding | Fast to integrate, developer-friendly | US-first risk models; no India scam corpus; no explainability for RBI-style supervision |
| **BioCatch** | Behavioural biometrics | Unique signal | Session behaviour, not message content; complementary rather than competing |
| **Perfios (incl. Karza) / Signzy / IDfy / HyperVerge / Bureau** | Indian identity & KYC | Excellent distribution into Indian banks, deep local trust | Verify *identity*, not *content*; they would need to build our pipeline from scratch |
| **Clari5 / Nelito / Maveric / Aurionpro** | Indian regtech & banking software | Existing bank integrations, SI relationships | Rules-driven, dated UX, limited ML; strong acquisition candidates |
| **Truecaller / ScamAdviser / government portals** | Consumer fraud checking | Massive consumer reach (Truecaller), official reporting channels | Consumer-only, no institutional API, no audit trail, no case workflow |
| **Bank internal builds** | In-house | Control, no vendor risk | Expensive to maintain, cannot see cross-institution patterns, always under-resourced |

### The gap, stated precisely

Nobody sells **narrative-level fraud adjudication with deterministic explainability, as an API,
tuned for Indian scam patterns, at a price a payment aggregator can sign.**

- Global vendors: right capability, wrong price, wrong language, wrong buying motion.
- Indian KYC vendors: right distribution, adjacent but different problem.
- Indian regtech: right relationships, wrong technology generation.
- Consumer tools: right corpus, no institution-facing product.
- In-house: right intent, cannot build cross-institution intelligence.

---

## 5. Positioning

> **For Indian regulated entities that must answer every fraud complaint with evidence,
> TrustScan is the adjudication API that turns any reported message, link, screenshot or
> document into a deterministic, explainable verdict — because the answer has to survive a
> customer dispute, an audit and an RBI inspection, not just a demo.**

| Incumbent claim | Our counter |
|---|---|
| "AI-powered fraud detection" | "Same input, same verdict, every time — with the weights shown" |
| "99% accuracy" | "Here is our labelled benchmark, and here is exactly where it fails" |
| "Real-time transaction scoring" | "We adjudicate the narrative your transaction monitoring cannot read" |
| "Enterprise platform, 12-month implementation" | "One API call, live in a week" |
| "Global model" | "Tuned on Hinglish, transliterated Hindi and Indian scam campaigns" |

The differentiator is not model quality. It is **defensibility** — a property that procurement,
compliance and legal all evaluate separately, and that no competitor can demonstrate quickly.

---

## 6. Buying centre and triggers

| Role | Cares about | Objection to pre-empt |
|---|---|---|
| Head of Fraud Risk | Loss reduction, case throughput | "Will this replace my team?" — no, it triages before them |
| CISO | Data handling, residency, vendor risk | Data localisation, encryption, audit logs |
| Compliance / DPO | DPDP obligations, purpose limitation | Consent basis, retention, deletion evidence |
| Head of Digital / Product | Time to integrate, customer experience | One API call, sub-second p50 |
| CFO | Cost per case | Measured against analyst minutes saved |

**Buying triggers** (time outreach to these):
- A regulatory inspection finding on fraud controls
- A publicised APP-fraud loss event or press story
- Launch of a new payment product that inherits fraud exposure
- DPDP readiness programmes forcing a vendor inventory
- A spike in customer complaints reaching social media

---

## 7. Distribution reality

| Channel | Role | Cost | Phase |
|---|---|---|---|
| Founder-led direct sales | First 6 accounts | Time | 1–2 |
| Consumer wedge (WhatsApp/web) | Brand, corpus, inbound | Marginal | 1 |
| System integrators (Infosys, TCS, Wipro, Maveric, Nelito) | Reach tier-2/3 banks | 15–25% margin | 3 |
| Industry bodies and events (NPCI/RBI ecosystem, FIBAC, India Fintech Forum) | Credibility | ₹3–8L/yr | 2 |
| Published accuracy benchmark + public scam reports | Inbound and press | Time | 1–2 |

**Explicitly not doing in year one:** cold outbound at scale, paid acquisition for the consumer
product, or a reseller-only model. Each assumes a sales motion that has not been proven.

---

## 8. Sources to verify before external use

This document deliberately avoids precise third-party statistics. Before any of it goes into a
deck, confirm and cite:

- NPCI UPI monthly transaction volumes and value (current month)
- RBI annual report figures on digital payment fraud value and volume
- Number of authorised payment aggregators and scheduled commercial banks (RBI lists)
- DPDP Act 2023 rules notification status and penalty schedule
- RBI Master Direction on Outsourcing of IT Services (current version) — vendor obligations
- CERT-In directions on incident reporting and log retention
- Whether RBI's Digital Payments Intelligence Platform has a vendor onboarding path

Each is a two-hour research task and each materially strengthens the pitch. Do not ship
approximate numbers to a bank.
