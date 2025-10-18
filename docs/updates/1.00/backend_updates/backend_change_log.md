# Backend Change Log

## Authentication hardening (Version 1.00)
- Enforced strict JWT verification parameters (issuer, audience, clock tolerance, max age) and reused them during signing so all session lifecycles honour the same guarantees.【F:backend-nodejs/src/config/index.js†L95-L104】【F:backend-nodejs/src/config/index.js†L353-L380】【F:backend-nodejs/src/services/sessionService.js†L1-L168】
- Delivered structured remediation messaging and correlation-aware audit logging in the authentication middleware, eliminating duplicate responses and giving clients actionable recovery steps for denied requests.【F:backend-nodejs/src/middleware/auth.js†L1-L305】
