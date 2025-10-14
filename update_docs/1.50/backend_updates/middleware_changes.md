# Middleware Updates

## Express Gateway Reinforcements
- Wrapped the core app in a CORS delegate that enforces wildcard, explicit, and subdomain allowlists, returning structured 403 responses for untrusted origins.
- Added global rate limiting via `express-rate-limit` with trusted proxy awareness and retry metadata, skipping only the `GET /` and `GET /healthz` probes to keep orchestrators responsive.
- Applied explicit JSON and URL-encoded body limits alongside strengthened Helmet configuration to further reduce gateway attack surface.
- Registered Morgan logging after the rate limiter to preserve throttled response metrics in downstream log pipelines.

## Authentication & Permissions Middleware
- `auth.js` now inspects signed cookies for access/refresh tokens, resolves vaulted signing keys for JWT verification, and injects actor metadata onto the request for downstream permission checks.
- `permissions.js` introduces declarative guards (`requirePermissions`) that tie into the security audit service, capturing allow/deny outcomes with contextual metadata for RBAC reporting.
- Middleware integrates with the new session token service to revoke cookies on logout and to audit refresh rotations, aligning Express handlers with the hardened session lifecycle.
