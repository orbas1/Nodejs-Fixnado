# Middleware Changes

## Authentication middleware
- Implemented structured remediation responses that include correlation IDs, remediation guidance, support contact details, and documentation links so clients can act on denial reasons without exposing stack traces.【F:backend-nodejs/src/middleware/auth.js†L1-L189】
- Hardened audit logging by attaching correlation IDs, token sources, and JWT failure metadata to `recordSecurityEvent` calls, improving traceability for SOC investigations.【F:backend-nodejs/src/middleware/auth.js†L165-L299】
- Normalised session expiry handling to clear cookies, emit precise error codes, and respect the stricter verification outcomes returned by the session service.【F:backend-nodejs/src/middleware/auth.js†L187-L259】
- Locked storefront override headers behind signed tokens, persona allowlists, and explicit denial responses so unauthenticated requests cannot spoof provider access when environments are misconfigured.【F:backend-nodejs/src/services/storefrontOverrideService.js†L1-L165】【F:backend-nodejs/src/middleware/auth.js†L94-L214】

## Feature toggle middleware
- Added a reusable feature toggle guard that deterministically buckets requests, emits denial audit events, and surfaces correlation-aware responses while failing open only during development incidents.【F:backend-nodejs/src/middleware/featureToggleMiddleware.js†L1-L147】
- Normalised rollout overrides and cohort hashing so finance and serviceman surfaces can stage pilots without code changes, while embedding the evaluated toggle state in response headers for observability.【F:backend-nodejs/src/middleware/featureToggleMiddleware.js†L15-L139】

## Security middleware (CORS, Helmet, rate limiting)
- Re-enabled strict Helmet protections (CSP, COEP, CORP, referrer policy, HSTS) and wired configuration-driven directives so security headers align with production expectations across environments.【F:backend-nodejs/src/app.js†L222-L313】
- Rebuilt the CORS guard to honour environment allowlists, wildcard/regex matchers, and null-origin restrictions, returning structured logs when origins are blocked and downgrading credentials for opaque origins.【F:backend-nodejs/src/app.js†L128-L215】【F:backend-nodejs/src/app.js†L270-L338】
- Augmented the rate limiter to emit `Retry-After` and `RateLimit-Policy` headers, attach correlation IDs, and log denials, giving clients deterministic backoff instructions instead of silent throttling.【F:backend-nodejs/src/app.js†L360-L407】
