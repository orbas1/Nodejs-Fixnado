# Config Changes

## JWT configuration hardening
- Added environment-controlled issuer, audience, allowed algorithms, clock tolerance, and max token age settings so deployments enforce the same identity guarantees regardless of region or runtime.【F:backend-nodejs/src/config/index.js†L95-L104】【F:backend-nodejs/src/config/index.js†L353-L360】
- Normalised access and refresh session TTLs into shared constants to prevent drift between token issuance and verification logic.【F:backend-nodejs/src/config/index.js†L95-L104】【F:backend-nodejs/src/config/index.js†L369-L380】
