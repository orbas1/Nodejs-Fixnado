# Backend Change Log

## Authentication hardening (Version 1.00)
- Enforced strict JWT verification parameters (issuer, audience, clock tolerance, max age) and reused them during signing so all session lifecycles honour the same guarantees.【F:backend-nodejs/src/config/index.js†L95-L104】【F:backend-nodejs/src/config/index.js†L353-L380】【F:backend-nodejs/src/services/sessionService.js†L1-L168】
- Delivered structured remediation messaging and correlation-aware audit logging in the authentication middleware, eliminating duplicate responses and giving clients actionable recovery steps for denied requests.【F:backend-nodejs/src/middleware/auth.js†L1-L305】

## Router consolidation & launch gating (Version 1.00)
- Refactored the API router to eliminate the duplicate `/` mirror of `/v1`, enforce single registrations per router module, and describe surface mounts in a declarative table for consistent ordering across releases.【F:backend-nodejs/src/routes/index.js†L1-L174】
- Introduced feature toggle guards for finance and serviceman domains that authenticate before evaluation, emit denial audits, and surface toggle metadata in headers so staged rollouts stay contained until stakeholders approve access.【F:backend-nodejs/src/routes/index.js†L40-L167】【F:backend-nodejs/src/middleware/featureToggleMiddleware.js†L1-L147】

## CORS, Helmet, and storefront override hardening (Version 1.00)
- Replaced the permissive CORS fallback with environment-aware allowlists, wildcard/regex evaluators, and explicit rejection logging so only sanctioned origins receive credentials while null origins lose cookie access.【F:backend-nodejs/src/app.js†L128-L217】【F:backend-nodejs/src/app.js†L270-L338】
- Restored secure Helmet defaults (CSP, COEP, CORP, referrer, HSTS) and enriched the rate limiter with `Retry-After`/`RateLimit-Policy` headers plus correlation-aware responses to unblock client backoff strategies.【F:backend-nodejs/src/app.js†L222-L313】【F:backend-nodejs/src/app.js†L360-L407】
- Introduced a dedicated storefront override service so header-based persona shims require signed override tokens, persona allowlists, and audit trails before middleware accepts unauthenticated storefront access.【F:backend-nodejs/src/services/storefrontOverrideService.js†L1-L165】【F:backend-nodejs/src/middleware/auth.js†L94-L214】
