# S1 — Master Assumptions Log
## NewsWright Business Plan — Single Source of Truth

**Version:** 1.2 | **Date:** February 11, 2026 | **Owner:** Michael Polzin (CTO) | **Status:** FINAL — All Decisions Applied (Session 1 + Phase 0 + Decision Handoff)

---

## How to Use This Document

Every financial variable, metric, and claim across the investor package is cataloged here. All documents (D1–D10, S2–S5) must reference this log. If a number appears in a deliverable, it must match this table. Confidence ratings (1–5) indicate how well-supported each assumption is. Sensitivity notes flag which variables most affect investor returns.

**Confidence Scale:** 1 = Speculative | 2 = Directional | 3 = Reasonable estimate | 4 = Well-supported | 5 = Verified/contractual

---

## A. Investment & Valuation Parameters

| # | Variable | Value | Source Document(s) | Confidence | Sensitivity Note |
|---|----------|-------|--------------------|------------|------------------|
| A1 | Seed Round Target | $500,000 | All docs (consistent) | 5 | Fixed; defines scope of plan |
| A2 | Pre-Money Valuation (Seed) | $4.5M–$5.0M | Financial Addendum v1.1, Investment Memo v3.1, Exec Summary v2.0 | 4 | Determines investor ownership; see A3 |
| A3 | Seed Investor Ownership (Post-Money) | 9.1%–10.0% | Return Analysis v2.1, Financial Addendum v1.1, Exec Summary v2.0 | 4 | Derived from A1/A2; directly affects return multiple |
| A4 | Post Series-Seed Dilution | ~15% (reducing seed to ~8%–8.5%) | Return Analysis v2.1, Investment Memo v3.1 | 3 | Critical variable for 10x return math; must be validated against Series Seed round size |
| A5 | Series Seed Round Target | **$1.0M–$1.5M** | Session 1 Decision Lock (C4) | 4 | RESOLVED: Bottom-up from V5.1 operating expenses. 10x return confirmed at all levels up to $1.5M. |
| A6 | Series Seed Pre-Money Valuation | **$8–$10M pre-money; anchor at $10M** | Session 1 Decision Lock (C5) | 4 | RESOLVED: Implies 10–14x revenue multiple on $720K ARR at M12. $60–90M is post-traction exit valuation (Year 3+), not Series Seed valuation. |
| A7 | Series Seed Timing | Month 9 (close by Month 12) | Financial Addendum v1.1, Comprehensive Memo | 4 | Runway-dependent; must close before Month 12 safety buffer |
| A8 | Instrument | SAFE or Priced Equity | Investment Memo v3.1 | 3 | To be determined in negotiation |
| A9 | MVP Development Value | $425,000 | All docs (consistent) | 4 | Replacement cost methodology; see disclaimer in Comprehensive Memo |

## B. Revenue & Growth Projections

| # | Variable | Value | Source Document(s) | Confidence | Sensitivity Note |
|---|----------|-------|--------------------|------------|------------------|
| B1 | M12 ARR (Base Case) | **$720,000** ($60K MRR) | V5.1 Operating Model (SOT per Session 1) | 4 | 92 customers. Collected revenue ~$355K (back-loaded ramp). |
| B2 | M12 Customers (Base Case) | **92** | V5.1 Operating Model | 4 | 50 pilot sites → 29 conversions → organic growth to 92 |
| B3 | M24 ARR (Base Case) | **$3,360,000** ($280K MRR) | V5.1 Operating Model | 3 | 338 customers at rising ARPU |
| B4 | M24 Customers (Base Case) | **338** | V5.1 Operating Model | 3 | Enterprise tilt drives higher ARPU |
| B5 | Year 3 ARR Target | **$6,000,000+** | All docs (consistent) | 3 | Anchor assumption; 10x return depends on this. Base Case reaches ~M29; Stretch Case ~M36. |
| B6 | M36 Customers (Base Case) | **908** | V5.1 Operating Model | 3 | **10.5% penetration** of 8,654 US outlets |
| B6a | M36 Customers (Stretch Case) | **1,000** | Market Research Memo (Decision 0.2 Option C) | 3 | 11.6% penetration of 8,654 US outlets; broader market adoption at blended pricing |
| B7 | Blended ARPU | **$500/month** | Phase 0 Decision 0.4 | 4 | Tier mix: 40% Core ($249), 35% Pro ($499), 18% Premium ($749), 7% Enterprise ($1,249) = ~$497 + overages ≈ $500 |
| B8 | Platform MRR (Year 3) | $3,000,000 (50% of mix) | Investment Memo v3.1, Comprehensive Memo | 3 | Core SaaS; $250 avg/client/mo |
| B9 | Consulting & Implementation (Year 3) | $1,500,000 (25% of mix) | Investment Memo v3.1, Comprehensive Memo | 3 | $125 avg/client/mo |
| B10 | Training & Certification (Year 3) | $900,000 (15% of mix) | Investment Memo v3.1, Comprehensive Memo | 2 | $75 avg/client/mo; market readiness unproven |
| B11 | Custom Development (Year 3) | $600,000 (10% of mix) | Investment Memo v3.1, Comprehensive Memo | 2 | $50 avg/client/mo; resource-intensive |
| B12 | Target Gross Margin | 75%–80% | Comprehensive Memo, Investment Memo v3.1, Exec Summary v2.0 | 3 | Blended across SaaS and services; services margin likely lower |

## C. Pricing Model

| # | Variable | Value | Source Document(s) | Confidence | Sensitivity Note |
|---|----------|-------|--------------------|------------|------------------|
| C1 | Core Tier | **$249/month** (3 seats) | Phase 0 Decision 0.1 (Option A) | 4 | 1–5 person outlets; replaces former $49 Starter |
| C2 | Pro Tier | **$499/month** (10 seats) | Phase 0 Decision 0.1 (Option A) | 4 | Typical small newsroom; full workflow suite |
| C3 | Premium Tier | **$749/month** (25 seats) | Phase 0 Decision 0.1 (Option A) | 4 | Multi-desk operations, advanced automation |
| C4 | Enterprise Tier | **$1,249/month** (60 seats) | Phase 0 Decision 0.1 (Option A) | 3 | TV, large outlets; SSO, custom integrations |
| C5 | Services: Implementation | $2K–$15K | Exec Summary v2.0 | 2 | Not in other docs; needs alignment |
| C6 | Services: Custom Dev | $5K–$25K | Exec Summary v2.0 | 2 | Not in other docs; needs alignment |
| C7 | Consulting Rate | $150–$300/hour | Exec Summary v2.0 | 2 | Not in other docs; needs alignment |
| C8 | ROI Multiple for Customer | **2.6x at Pro tier** | Phase 0 Decision 0.1 + market research | 4 | At $499/mo (Pro): 3 journalists × 17 hrs saved × $25/hr = $1,275/mo value = 2.6x subscription. |

## D. Use of Funds

| # | Variable | Value | Source Document(s) | Confidence | Sensitivity Note |
|---|----------|-------|--------------------|------------|------------------|
| D1 | Stealth Pilot Total (Months 1–3) | **$140,289** (V5.1: $46,763/mo × 3) | V5.1 Operating Model (SOT) | 4 | V5.1 lean model with 50 pilot sites, 3 cohorts. Note: Earlier docs show $290,935 for 5-site pilot; V5.1 supersedes. |
| D2 | Contracted Resources (Dev Firm) | $165,548 (33.1%) | Job Reqs v1.1, Financial Addendum v1.1 | 5 | Largest single line item |
| D3 | Founder Compensation (3 months) | $72,000 (14.4%) | Job Reqs v1.1, Financial Addendum v1.1 | 5 | Michael $45K + Denise $6.6K + David $11.1K + Benefits $9.3K |
| D4 | Dev Tools & Cloud Hosting | $12,000 (2.4%) | All financial docs (consistent) | 4 | $4K/month for 3 months |
| D5 | Branding Company | $20,000 (4.0%) | Pilot Plan v1.1, Financial Addendum v1.1 | 4 | Allocated from original Risk Reserve |
| D6 | Risk Reserve (reduced) | $21,387 (4.3%) | Pilot Plan v1.1, Financial Addendum v1.1 | 4 | Originally $41,387 before branding allocation |
| D7 | Post-Pilot Bridge (Months 4–12) | $209,065 (41.8%) | Financial Addendum v1.1 | 4 | Includes founder comp, infra, SOC 2, contingency |

## E. Monthly Burn & Runway

| # | Variable | Value | Source Document(s) | Confidence | Sensitivity Note |
|---|----------|-------|--------------------|------------|------------------|
| E1 | Monthly Burn (Months 1–3) | **$46,763** | V5.1 Operating Model (SOT) | 4 | Lean model: Michael full-time + contracted PM + infrastructure. Note: Earlier docs show $80K for 5-site model; V5.1 supersedes. |
| E2 | Monthly Burn (Months 4–12) | Variable per V5.1 ramp | V5.1 Operating Model (SOT) | 4 | Scales with hiring: GM at M4, Denise/David at 25 clients (M5), dev expansion at ~50 clients |
| E3 | Cash at Gate 1 (Month 3) | **$345,682** | V5.1 Operating Model | 4 | $500K minus 3 months at V5.1 burn rate |
| E4 | Break-Even | **Month 15** | V5.1 Operating Model | 3 | Revenue exceeds operating costs |
| E5 | Series Seed Timing | **Month 10** (close) | Session 1 Decision Lock | 4 | $1.0–$1.5M at $8–$10M pre-money |
| E6 | Total Runway (Seed Only) | **12+ months** | V5.1 Operating Model | 4 | Conservative; revenue begins M4 post-conversions |

## F. Market Sizing

| # | Variable | Value | Source Document(s) | Confidence | Sensitivity Note |
|---|----------|-------|--------------------|------------|------------------|
| F1 | TAM (AI in Media) | $8–$26B (2024) → $51–$99B (2030) | Comprehensive Memo | 2 | Very wide range; synthesis of multiple analyst reports |
| F2 | SAM (Newsroom Tools) | $8–$10B (2024) → $20–$25B (2030) | Comprehensive Memo | 3 | More focused but still broad |
| F3 | TAM Growth Rate (CAGR) | 15%–18% | All docs (consistent) | 3 | Industry analyst consensus |
| F4 | US Local News Outlets | **8,654** | Phase 0 Decision 0.3; Medill 2025 + RTDNA 2024 [Z1, Z2] | **5** | RESOLVED (was 6,000–11,000 CONFLICT). See segment breakdown F12–F15. |
| F5 | Global News Outlets | 25,000+ across 85+ countries | Comprehensive Memo | 3 | WAN-IFRA source |
| F6 | US Addressable (ICP Match) | **2,500–3,500** (indie digital + nonprofit) | Market Research Memo; Medill 2025 [Z1] | 4 | Updated from 1,800–2,100. Broader addressable = full 8,654. |
| F7 | US Papers Closed Since 2005 | **3,200+** | Medill 2025 [Z1] | **5** | RESOLVED (was 2,900–3,200+). Standardized to most recent Medill figure. |
| F8 | Journalism Employment (2024) | **91,550 employed** (down 7% YoY); **75% decline from 360K peak** | Medill 2025 [Z1] | **5** | RESOLVED (was "43,000+ jobs lost"). Drop "43,000+" figure; use percentage + absolute framing. |
| F9 | News Deserts (US) | **208 counties** with zero coverage; **1,563 counties** with only one source | Medill 2025 [Z1] | **5** | RESOLVED. Standardized to county-level Medill metric. |
| F10 | Foundation Funding Available | $600–$700M+ annually | Market Sizing doc, Return Analysis v2.1 | 4 | Well-documented; Press Forward $500M+ (40+ chapters) is anchor |
| F11 | US TAM at $500/site/mo | **$51.9M ARR** | Calculated: 8,654 × $500 × 12 | 4 | Unit TAM at target pricing |
| F12 | Newspapers (current count) | **5,419** (62.6%) | Medill 2025 [Z1] | 5 | Declining ~148/year (~2.7%) |
| F13 | Standalone digital outlets | **695** (8.0%) | Medill 2025 [Z1] | 5 | Growing +33/year (~4.8%) |
| F14 | Network digital sites | **853** (9.9%) | Medill 2025 [Z1] | 5 | Growing +111/year (~13%) |
| F15 | TV originating local news ops | **695** (8.0%) | RTDNA 2024 [Z2, Z3] | 4 | Slight decline; 27,066 FTE employed |
| F16 | Local TV news employment | **27,066 FTE** | RTDNA 2024 [Z2] | 4 | Down from peak; hiring declining |
| F17 | Newspaper closures (annual) | **148/year (~2.7%)** | Medill 2025 [Z1] | 4 | Steady decline rate |
| F18 | Digital outlet growth (annual) | **+33 standalone, +111 network** | Medill 2025 [Z1] | 4 | Composition shifting to digital |
| F19 | Radio stations running local news | **~11,000** (70.5% of 15,686) | RTDNA/FCC [Z3, Z7] | 2 | Potential expansion market; not in core ICP |

## G. Pilot & Operational Metrics

| # | Variable | Value | Source Document(s) | Confidence | Sensitivity Note |
|---|----------|-------|--------------------|------------|------------------|
| G1 | Pilot Sites | **50 newsrooms** (3 cohorts: 10+20+20) | V5.1 Operating Model (SOT) | 4 | Replaces 5-site model from earlier docs |
| G2 | Pilot Duration | 90 calendar days (13 weeks) | Pilot Plan v1.1, V5.1 Operating Model | 5 | Fixed |
| G3 | Time Savings Target | ≥40% per workflow | Pilot Plan v1.1, Business Plan Project Plan | 4 | Primary success metric |
| G4 | AI Draft Approval Rate Target | ≥80% with ≤2 revisions | Pilot Plan v1.1, 18-Month Roadmap v1.1 | 4 | Secondary success metric |
| G5 | Testimonials Required | **≥10 (written or video)** | Decision Handoff v1.0, Pilot Plan v3.1 | 5 | Gate 1 criteria. Updated from ≥3 per Handoff. |
| G6 | Sites Willing to Continue | **≥40 of 50 (80%)** | Decision Handoff v1.0, Pilot Plan v3.1 | 4 | Gate 1 criteria. Updated from ≥4/5 to ≥40/50 for 50-site model. |
| G7 | Ethics Violations Allowed | Zero | Pilot Plan v1.1, 18-Month Roadmap v1.1 | 5 | Absolute requirement |
| G8 | Branding Company Budget | **$20,000 (M4–M6, $6,667/mo)** | Decision Handoff v1.0 | 4 | Post-Gate 1 expenditure; no branding gate at Gate 1. Timing updated from Days 15–85 to M4–M6 per Handoff. |
| G9 | Measured Time Savings (Testbed) | 17 hours/journalist/month | Pitch Deck, Mason meeting transcript | 4 | Racine County Eye; ~10 min/obituary × ~5/day |
| G10 | Total Pilot Hours | **1,423** | Job Reqs v2.0 (authoritative per Decision Handoff v1.0) | 4 | **Founders 585** (Michael 390 + Denise 65 + David 130) + Contracted 838 |
| G11 | Productivity Multiplier (Dev) | 20–25x | All docs (consistent) | 3 | ORCHESTRATE methodology claim; key differentiator |

## H. Return Analysis Variables

| # | Variable | Value | Source Document(s) | Confidence | Sensitivity Note |
|---|----------|-------|--------------------|------------|------------------|
| H1 | Year 3 Exit Multiple | 10x ARR | Return Analysis v2.1, Investment Memo v3.1 | 3 | AI-native vertical SaaS comparable |
| H2 | Year 3 Exit Valuation | $60M | Return Analysis v2.1 | 3 | $6M × 10x |
| H3 | Year 3 Investor Return | 10.0x ($5M on $500K) | Return Analysis v2.1 | 3 | At ~8% post-dilution ownership |
| H4 | Year 5 Exit Multiple | 10x–12x ARR | Return Analysis v2.1 | 2 | Longer horizon; less certain |
| H5 | Year 5 ARR (Base Case) | $10M | Return Analysis v2.1 | 2 | Requires international expansion |
| H6 | Year 5 Exit Valuation (Base) | $100M | Return Analysis v2.1 | 2 | $10M × 10x |
| H7 | Year 5 Investor Return (Base) | 16.0x ($8M) | Return Analysis v2.1 | 2 | At ~8% post-dilution |
| H8 | Downside Scenario (Year 5) | $6M ARR → $48M → 7.7x | Return Analysis v2.1 | 3 | Delayed growth; still returns capital |
| H9 | Upside Scenario (Year 5) | $12M ARR → $144M → 23.0x | Return Analysis v2.1 | 2 | Requires strong international traction |

## I. Exit & Valuation (Post-Traction)

| # | Variable | Value | Source Document(s) | Confidence | Sensitivity Note |
|---|----------|-------|--------------------|------------|------------------|
| I1 | Post-Traction Valuation Range | $60M–$90M | Comprehensive Memo, Exec Summary v2.0 | 2 | At 10x–15x Year 3 ARR; aspirational |
| I2 | Primary Exit Thesis | Acquisition (Automattic primary) | Exec Summary v2.0 | 2 | Parse.ly comp ($100M+), WooCommerce (~$30M), Pocket Casts (~$20M) |
| I3 | Secondary Exit | Public IPO / Reverse IPO | Exec Summary v2.0 | 1 | Very early for this discussion |
| I4 | Additional Exit Options | Chain publishers, enterprise CMS ecosystem | Exec Summary v2.0 | 2 | Broadens acquirer pool |

## J. Technical & Product

| # | Variable | Value | Source Document(s) | Confidence | Sensitivity Note |
|---|----------|-------|--------------------|------------|------------------|
| J1 | MVP Completion | 100% (500+ tickets, 100+ stories, 50+ sprints) | All docs | 4 | Self-reported; code review pending |
| J2 | Backend Tech | Python 3.11, FastAPI 0.122 | Comprehensive Memo (Appendix C) | 5 | Verified |
| J3 | Frontend Tech | TypeScript, Next.js 14, React 18 | Comprehensive Memo (Appendix C) | 5 | Verified |
| J4 | AI Framework | CrewAI 1.6, 6 agents | Comprehensive Memo (Appendix C) | 4 | Platform dependency risk |
| J5 | CMS Integration | WordPress REST API | All docs | 5 | Primary deployment target |
| J6 | Time to Production (Optimistic) | 6 weeks | Mason meeting transcript (Michael estimate) | 2 | Assumes clean code review |
| J7 | Time to Production (Conservative) | 9–12 months | Mason meeting transcript (Michael estimate) | 3 | If significant rework needed |
| J8 | Traditional Dev Path | 14 months / $1,072,000 | Comprehensive Memo, Investment Memo v3.1 | 3 | Comparison baseline |
| J9 | AI + ORCHESTRATE Path | 6.5 months / $497,000 | Comprehensive Memo, Investment Memo v3.1 | 3 | 54% savings claim |

---

## Resolved Decisions (formerly "Assumptions Requiring Founder Decision")

| # | Question | Resolution | Source |
|---|----------|------------|--------|
| Q1 | Series Seed size | **$1.0M–$1.5M** | Session 1 Decision Lock (C4) |
| Q2 | Series Seed pre-money | **$8–$10M; anchor $10M** | Session 1 Decision Lock (C5) |
| Q3 | US outlet count | **8,654** | Phase 0 Decision 0.3 |
| Q4 | Newspapers closed | **3,200+** | Phase 0 Decision 0.3 / Medill 2025 |
| Q5 | Revenue source of truth | **V5.1 Operating Model** | Session 1 Decision Lock (C6/C7) |
| Q6 | Pricing tier structure | **$249 / $499 / $749 / $1,249** | Phase 0 Decision 0.1 (Option A) |
| Q7 | Customer ramp scenario | **Dual: Base (V5.1) + Stretch (Research)** | Phase 0 Decision 0.2 (Option C) |
| Q8 | Blended ARPU | **$500/month** | Phase 0 Decision 0.4 |

---

## Z. Primary Sources (Market Data)

| # | Source | Citation | Access Date |
|---|--------|----------|-------------|
| Z1 | Northwestern Medill State of Local News 2025 | https://localnewsinitiative.northwestern.edu/projects/state-of-local-news/2025/report/ | Feb 11, 2026 |
| Z2 | RTDNA/Newhouse Local TV News Employment | https://www.rtdna.org/news/local-tv-news-employment-moves-down--along-with-hiring | Feb 11, 2026 |
| Z3 | RTDNA/Newhouse Amount of Local News | https://www.rtdna.org/news/amount-of-local-news-stays-steady--for-a-change | Feb 11, 2026 |
| Z4 | Medill Methodology | https://localnewsinitiative.northwestern.edu/projects/state-of-local-news/2025/methodology/ | Feb 11, 2026 |
| Z5 | LION Project Oasis | https://lionpublishers.com/introducing-project-oasis-a-deep-dive-into-the-fast-growing-world-of-independent-news-startups/ | Feb 11, 2026 |
| Z6 | INN Index 2024 Staffing | https://inn.org/research/inn-index/index-2024/staffing-capacity/ | Feb 11, 2026 |
| Z7 | FCC Broadcast Station Totals (Dec 2025) | https://docs.fcc.gov/public/attachments/DA-26-49A1.pdf | Feb 11, 2026 |
| Z8 | Global Project Oasis | https://globalprojectoasis.org/ | Feb 11, 2026 |

---

*End of S1 — Master Assumptions Log v1.2*
*Updated: February 11, 2026 — Decision Handoff v1.0 applied: G5 (≥10 testimonials), G6 (≥40/50), G8 (M4–M6), G10 (585 founder hours)*
*Prepared following ORCHESTRATE methodology*
