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
- `PII_ENCRYPTION_KEY`: Base64-encoded 32-byte key used for AES-256-GCM encryption of sensitive columns.
- `PII_HASH_KEY`: Base64-encoded 32-byte key used for deterministic SHA-512/HMAC hashes enabling encrypted lookups.
- `PII_ENCRYPTION_KEY_ID`: Optional identifier to track the active key version for rotation runbooks.
- `PII_ENCRYPTION_KEY_PREVIOUS`: Optional base64 key stored temporarily during rotations for decrypt-only operations.
- `JWT_SECRET_SECRET_ID`, `ADMIN_SECURITY_TOKEN_SECRET_ID`, `DB_PASSWORD_SECRET_ID`: AWS Secrets Manager identifiers consumed by `secretVaultService` when direct environment variables are absent.
- `ACCESS_TOKEN_COOKIE_NAME`, `REFRESH_TOKEN_COOKIE_NAME`, `SESSION_COOKIE_NAME`: Cookie identifiers surfaced through configuration to align cookie parsing middleware and vault-backed token issuance.
- `TOKEN_ROTATION_INTERVAL_MINUTES`, `TOKEN_ACCESS_TTL_MINUTES`, `TOKEN_REFRESH_TTL_HOURS`: Rotation and TTL tunables for the session token service, enabling environment-level adjustments without code changes.

## Operational Guidance
- Production environments must explicitly set the allowlist to partner domains; staging/test environments can retain open access by leaving the variable unset.
- When placing the API behind multiple proxies (Cloudflare → Ingress → App), set `SECURITY_TRUST_PROXY` to the numeric hop count to preserve the originating IP for rate limiting.
- Monitor limiter metrics after rollout and adjust the window/quota to match observed throughput before enabling additional Task 1 controls (token rotation, audit logging).
- Store PII keys in the secrets manager with strict rotation cadence; never commit values to source control or CI logs.
- Run migration rehearsals with throwaway keys to validate encryption backfill before promoting to production keys.
