# Middleware Changes

## Authentication middleware
- Implemented structured remediation responses that include correlation IDs, remediation guidance, support contact details, and documentation links so clients can act on denial reasons without exposing stack traces.【F:backend-nodejs/src/middleware/auth.js†L1-L189】
- Hardened audit logging by attaching correlation IDs, token sources, and JWT failure metadata to `recordSecurityEvent` calls, improving traceability for SOC investigations.【F:backend-nodejs/src/middleware/auth.js†L165-L299】
- Normalised session expiry handling to clear cookies, emit precise error codes, and respect the stricter verification outcomes returned by the session service.【F:backend-nodejs/src/middleware/auth.js†L187-L259】
