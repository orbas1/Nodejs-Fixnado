# Routes Updates

## API router consolidation and feature gating
- Rebuilt the Express router composition so `/v1` is the sole public mount, duplicate registrations throw immediately, and every surface is described through a single declarative table to keep middleware order deterministic across deployments.【F:backend-nodejs/src/routes/index.js†L1-L125】【F:backend-nodejs/src/routes/index.js†L127-L174】
- Grouped serviceman tooling behind an authenticated feature gate that feeds all downstream routers, preventing control-centre, booking, metrics, and escrow APIs from leaking before the `serviceman.core` rollout is approved.【F:backend-nodejs/src/routes/index.js†L64-L87】【F:backend-nodejs/src/routes/index.js†L154-L167】
- Applied the `finance.platform` toggle to finance, wallet, and provider escrow routes so payout tooling can be enabled per environment while returning consistent denial messaging when the gate is closed.【F:backend-nodejs/src/routes/index.js†L40-L48】【F:backend-nodejs/src/routes/index.js†L140-L152】
