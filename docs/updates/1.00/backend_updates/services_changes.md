# Services Changes

## Session service
- Centralised JWT signing via `signAccessToken`, reusing the hardened issuer/audience configuration and ensuring access tokens always embed persona and tenant metadata consistently.【F:backend-nodejs/src/services/sessionService.js†L8-L111】
- Updated refresh rotation to use the shared signing helper so rotated sessions inherit the new verification guarantees without duplicating options.【F:backend-nodejs/src/services/sessionService.js†L123-L168】
- Rebuilt `verifyAccessToken` to enforce strict issuer, audience, algorithm, clock tolerance, and maximum age checks while optionally returning diagnostic codes for middleware remediation flows.【F:backend-nodejs/src/services/sessionService.js†L250-L280】

## Storefront override service
- Added a dedicated storefront override evaluation service that validates override tokens (including hashed secrets), persona/role allowlists, and expiry headers before granting temporary provider contexts for test harnesses.【F:backend-nodejs/src/services/storefrontOverrideService.js†L1-L165】
