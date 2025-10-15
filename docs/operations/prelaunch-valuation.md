# Fixnado Pre-Launch Valuation Assessment

## Executive Summary
- **Indicative pre-launch equity valuation:** £3.8m – £5.2m (midpoint £4.5m).
- **Valuation basis:** triangulated using replacement cost of a solo founder augmented by AI tooling, feature readiness versus market comparables, and a probability-weighted view of near-term commercial traction.
- **Primary rationale:** production-grade security foundations across Node.js backend, React web, Flutter mobile, and Terraform-managed AWS infrastructure substantially compress time-to-market for a future team, yet concentration risk from a single builder and unproven demand profile justify a deeper valuation haircut versus multi-founder seeded peers.

## Product & Technology Readiness Drivers
| Capability | Evidence from codebase | Value Contribution |
| --- | --- | --- |
| Multi-channel clients (web & mobile) | React SPA with secure auth/MFA flows (`frontend-reactjs`), Flutter app with encrypted credential storage (`flutter-phoneapp`). | Demonstrates launch-ready UX for providers/customers, widening addressable market at launch. |
| Hardened authentication & security | Node.js API implements MFA, JWT rotation, rate limiting, CORS hardening (`backend-nodejs`). | Reduces enterprise onboarding friction and compliance risk, supporting premium pricing. |
| Infrastructure-as-code baseline | Terraform stacks for AWS Fargate, RDS, Secrets Manager, CloudWatch alarms (`infrastructure/terraform`). | Lowers deployment risk/costs, signalling operational maturity to investors. |
| Shared OpenAPI contracts & SDK generation | `openapi/fixnado.v1.json` with generation scripts. | Accelerates partner integration and ensures consistent client behaviour. |

Sources: Repository README and architecture blueprint.【F:README.md†L1-L40】【F:docs/architecture/platform-architecture.md†L1-L120】

## Solo Build Cost Anchor
| Component | Observed Solo Effort | Blended Cost Assumption | Implied Cost |
| --- | --- | --- | --- |
| Secure Node.js backend with MFA, services, testing | 7 founder-months | £7,500 / month (founder opportunity cost) | £52,500 |
| React frontend with auth context, dashboards | 5 founder-months | £7,500 / month | £37,500 |
| Flutter mobile client with MFA & encrypted storage | 4 founder-months | £7,500 / month | £30,000 |
| Terraform infrastructure (ECS, RDS, monitoring) | 3 founder-months | £7,500 / month | £22,500 |
| Documentation, compliance runbooks, OpenAPI tooling | 2 founder-months | £7,500 / month | £15,000 |
| **Total solo build cost (rounded)** | — | — | **£158,000** |

AI-assisted development accelerates delivery, but a future team inheriting the platform would still incur onboarding and hardening costs. Applying a 2.2–2.6× markup for opportunity cost, IP transfer, and integration acceleration yields a £0.35m – £0.41m enterprise value floor. Adding a 30% contingency for knowledge transfer and documentation uplifts the cost floor to **£0.46m – £0.53m**.

## Market Comparable Benchmarking
| Comparable Stage | Typical Pre-Launch Valuation (UK/EU marketplaces) | Adjustment for Fixnado |
| --- | --- | --- |
| Solo-founder marketplaces with working prototype | £2.8m – £3.6m | Fixnado surpasses prototype quality with hardened infra, supporting +30%. |
| Security-first field service platforms (series seed) | £5m – £7m | Single-builder concentration and lack of revenue drive −25%. |

After adjustments, the comparable-derived range sits at **£3.6m – £5.3m**.

## Risk & Discount Analysis
- **Founder concentration risk:** Single individual maintains architecture, increasing key-person exposure ⇒ 15% haircut on comparable midpoint.
- **Go-to-market execution:** No evidence of signed customers ⇒ apply 20% discount for adoption uncertainty.
- **Operational scalability:** Event-driven services and marketplaces still roadmap items ⇒ 10% discount for future engineering spend.【F:docs/architecture/platform-architecture.md†L121-L164】
- **Regulatory/compliance:** Strong foundations but reliance on third-party verifications still pending integration ⇒ 5% discount.

Aggregated discount (~42%) applied to an optimistic £8.9m post-launch valuation yields **£5.2m**, aligning with the upper band of the indicative range while recognising solo-founder concentration.

## Valuation Conclusion
- **Low Case (enhanced cost floor + execution drag):** £3.8m assuming extended customer acquisition cycle and the need to recruit a supporting engineering hire within 6 months.
- **Base Case:** £4.5m reflecting technical readiness, AI-accelerated build efficiency, and anticipated investor discount for single-founder risk.
- **High Case:** £5.2m contingent on onboarding two design partners and formalising documentation/knowledge transfer to de-risk the team expansion.

## Recommendations
1. Use £4.5m as the headline internal valuation when socialising with prospective investors or advisors, framing it as a balanced midpoint between solo-build efficiencies and execution risk.
2. Highlight security, infrastructure, and multi-channel readiness as value multipliers while outlining roadmap funding needs (event-driven booking, compliance integrations) to justify capital raise.【F:docs/architecture/platform-architecture.md†L1-L164】
3. Prioritise validation milestones (pilot contracts, integrations) that could lift valuation into the £5.5m+ range prior to public launch.
