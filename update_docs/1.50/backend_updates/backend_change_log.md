# Backend Change Log – Version 1.50

## 2025-02-20 – Security & Secrets Hardening, Subtask 4
- Hardened the Express gateway with configurable rate limiting, trusted proxy support, body size governance, and a curated CORS allowlist derived from environment variables.
- Delivered an operational `/healthz` endpoint exposing uptime, ISO-8601 timestamp, and database latency to feed load balancer probes and monitoring dashboards.
- Extended test coverage with an API gateway regression suite validating health telemetry, CORS rejections, and request throttling semantics.
