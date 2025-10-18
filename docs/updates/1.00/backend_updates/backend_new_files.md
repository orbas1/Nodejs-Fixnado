# Backend New Files

- `backend-nodejs/src/middleware/featureToggleMiddleware.js` — Express middleware that evaluates feature toggles with cohort hashing, structured denial responses, and audit logging so rollout gates can be enforced without duplicating logic across routes.【F:backend-nodejs/src/middleware/featureToggleMiddleware.js†L1-L147】
- `backend-nodejs/src/services/storefrontOverrideService.js` — Hardened storefront override evaluator that validates signed override tokens, persona allowlists, and expiry headers before letting test harnesses impersonate provider personas.【F:backend-nodejs/src/services/storefrontOverrideService.js†L1-L165】
