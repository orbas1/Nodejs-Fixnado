# Backend Change Log

## Authentication hardening (Version 1.00)
- Enforced strict JWT verification parameters (issuer, audience, clock tolerance, max age) and reused them during signing so all session lifecycles honour the same guarantees.【F:backend-nodejs/src/config/index.js†L95-L104】【F:backend-nodejs/src/config/index.js†L353-L380】【F:backend-nodejs/src/services/sessionService.js†L1-L168】
- Delivered structured remediation messaging and correlation-aware audit logging in the authentication middleware, eliminating duplicate responses and giving clients actionable recovery steps for denied requests.【F:backend-nodejs/src/middleware/auth.js†L1-L305】

## Router consolidation & launch gating (Version 1.00)
- Refactored the API router to eliminate the duplicate `/` mirror of `/v1`, enforce single registrations per router module, and describe surface mounts in a declarative table for consistent ordering across releases.【F:backend-nodejs/src/routes/index.js†L1-L174】
- Introduced feature toggle guards for finance and serviceman domains that authenticate before evaluation, emit denial audits, and surface toggle metadata in headers so staged rollouts stay contained until stakeholders approve access.【F:backend-nodejs/src/routes/index.js†L40-L167】【F:backend-nodejs/src/middleware/featureToggleMiddleware.js†L1-L147】
