# Configuration Changes

## Security Namespaces Added to `src/config/index.js`
- Introduced a `security` configuration branch with sub-namespaces for `cors`, `bodyParser`, `rateLimiting`, and `health` so operational policies can be expressed via environment variables and audited centrally.
- Added intelligent parsers (`boolFromEnv`, `listFromEnv`, etc.) to safely consume comma-separated allowlists and human-readable booleans while defaulting to production-safe values.
- Normalised trusted proxy and client IP header handling, enabling reverse proxies/CDNs to be configured without code changes.

## Defaults Tuned for Production Gateways
- JSON and URL-encoded payload sizes now default to `1mb` but can be restricted per-environment via `REQUEST_JSON_LIMIT` and `REQUEST_URLENCODED_LIMIT`.
- Rate limiting defaults to a 1-minute window and 120 requests per client, with overrides for header behaviour and success skipping, preparing us for burst management once environment load profiles are known.
- Database health checks expose a configurable timeout (`HEALTHCHECK_DB_TIMEOUT_MS`) ensuring slow replicas are caught during readiness probes.

## PII Configuration Visibility
- Added a `security.pii` namespace exposing whether the encryption and hash keys are present, alongside optional rotation identifiers.
- Application startup now fails fast if the encryption or hash keys are missing, preventing plaintext persistence in misconfigured environments.
