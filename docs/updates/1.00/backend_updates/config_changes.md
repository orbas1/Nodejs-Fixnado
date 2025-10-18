# Config Changes

## JWT configuration hardening
- Added environment-controlled issuer, audience, allowed algorithms, clock tolerance, and max token age settings so deployments enforce the same identity guarantees regardless of region or runtime.【F:backend-nodejs/src/config/index.js†L95-L104】【F:backend-nodejs/src/config/index.js†L353-L360】
- Normalised access and refresh session TTLs into shared constants to prevent drift between token issuance and verification logic.【F:backend-nodejs/src/config/index.js†L95-L104】【F:backend-nodejs/src/config/index.js†L369-L380】

## Feature toggle defaults and overrides
- Seeded mandatory finance and serviceman toggle definitions with production-safe defaults so launch gating works even when Secrets Manager is unavailable, while still allowing environment overrides.【F:backend-nodejs/src/config/index.js†L120-L139】【F:backend-nodejs/src/config/index.js†L489-L495】
- Added override normalisation that converts array payloads, enforces string states, and clamps rollout percentages before handing values to the feature toggle service, preventing malformed secrets from bypassing safety rails.【F:backend-nodejs/src/config/index.js†L141-L166】【F:backend-nodejs/src/config/index.js†L489-L495】

## CORS, Helmet, and storefront override configuration
- Introduced environment-specific CORS allowlists, CSP directives, and helmet toggles so deployments automatically adopt safe defaults while still permitting explicit overrides via environment variables.【F:backend-nodejs/src/config/index.js†L58-L166】【F:backend-nodejs/src/config/index.js†L337-L399】
- Added signed storefront override secrets, environment allowlists, persona/role constraints, and token header configuration so test harnesses can be enabled deliberately without leaving staging or production open to header impersonation.【F:backend-nodejs/src/config/index.js†L104-L166】【F:backend-nodejs/src/config/index.js†L353-L399】
