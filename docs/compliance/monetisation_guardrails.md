# Monetisation guardrails

This note documents the updated marketplace monetisation defaults introduced for the 2.5% platform commission rollout.

## Platform commission baseline
- The default commission retained by Fixnado across all bookings is **2.5%** of the gross order value. This baseline is enforced in the platform settings API and propagated to the provider dashboards.
- Administrators can still layer demand-specific overrides (for example `scheduled:high`) when strategic campaigns require incentives, but the global fallback always reverts to 2.5%.
- Savings, deal builders, and analytics roll-ups now pull their rate from the cached platform settings instead of a hard-coded 12% constant, ensuring customer-facing collateral reflects policy changes immediately.

## Provider controlled crew compensation
- Providers retain the ability to decide the precise amounts paid to their servicemen. Platform settings merely record ledger references and do not insert the platform into the wage negotiation loop.
- This keeps Fixnado outside the scope of UK FCA e-money requirements because customer funds are never pooled or warehoused by the marketplace—payouts are triggered directly between contracting parties.

## Ledger and wallet resiliency
- Commission rates are validated server-side to remain between 0% and 100%, protecting ledger calculations from malformed input.
- Cached settings refresh atomically so downstream services (finance, analytics, storefront panels) always observe a coherent commission rate structure.
- Provider storefront “savings” chips calculate against the same cached base rate to avoid discrepancies between marketing copy and wallet debits.

## Apple App Store compliance snapshot
- The mobile client continues to fall under App Store Review Guideline 3.1.3(f) for physical services, which allows external payment rails without mandating in-app purchase (IAP).
- By treating the wallet as a pass-through accounting layer and not storing consumer balances, we avoid characteristics associated with digital goods or stored value facilities that would otherwise require IAP integration.
- In the event Apple reviewers request evidence, screenshots of the admin Monetisation controls now highlight the policy: external escrow with a 2.5% platform fee and provider-managed payouts.
