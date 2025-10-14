# Build & Dependency Updates – Version 1.50

## Backend
- Added `express-rate-limit@6.11.2` to enforce gateway throttling and shipped the updated `package-lock.json` for reproducible installs.
- No other backend build pipeline changes were required; existing lint/test tooling continues to operate against the hardened gateway.
- Vitest setup seeds deterministic PII encryption and hash keys so encrypted model tests execute reliably across CI agents.
