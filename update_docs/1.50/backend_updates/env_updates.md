# Environment Variable Updates

## New Variables
- `SECURITY_TRUST_PROXY`: Controls the Express `trust proxy` setting. Use `loopback`, `true`, numeric hop counts, or set to `false` to disable proxy trust.
- `SECURITY_CLIENT_IP_HEADER`: Header name for extracting the originating IP (defaults to `x-forwarded-for`).
- `CORS_ALLOWLIST`: Comma-separated list of fully qualified origins (supports `*.` wildcards) allowed to access the API gateway.
- `CORS_ALLOW_METHODS`, `CORS_ALLOW_HEADERS`, `CORS_EXPOSE_HEADERS`: Optional comma-separated overrides for HTTP verbs and header handling.
- `CORS_ALLOW_CREDENTIALS`: Boolean toggle for credential propagation across origins (defaults to `true`).
- `REQUEST_JSON_LIMIT`, `REQUEST_URLENCODED_LIMIT`: Payload size caps consumed by the JSON and URL-encoded body parsers.
- `RATE_LIMIT_WINDOW_MINUTES`, `RATE_LIMIT_MAX_REQUESTS`: Window and request quota for throttling clients (defaults 1 minute / 120 requests).
- `RATE_LIMIT_SKIP_SUCCESS`, `RATE_LIMIT_STANDARD_HEADERS`, `RATE_LIMIT_LEGACY_HEADERS`: Behavioural toggles for limiter accounting and headers.
- `HEALTHCHECK_DB_TIMEOUT_MS`: Millisecond timeout applied to the database readiness probe.

## Operational Guidance
- Production environments must explicitly set the allowlist to partner domains; staging/test environments can retain open access by leaving the variable unset.
- When placing the API behind multiple proxies (Cloudflare → Ingress → App), set `SECURITY_TRUST_PROXY` to the numeric hop count to preserve the originating IP for rate limiting.
- Monitor limiter metrics after rollout and adjust the window/quota to match observed throughput before enabling additional Task 1 controls (token rotation, audit logging).
