# Front-end Pre-Update Evaluation (v1.00)

## Functionality
- `App.jsx` wires more than 70 lazy routes into a single component, making route-level guards brittle and hurting tree-shaking. The duplication of provider dashboards and dev previews also increases the chance of dead routes shipping to production. (`frontend-reactjs/src/App.jsx`).
- `ProviderProtectedRoute` relies on `useSession().hasRole` but does not ensure feature readiness; users without storefront access simply see a static denial page instead of being redirected to onboarding. (`frontend-reactjs/src/components/auth/ProviderProtectedRoute.jsx`).
- The session hook defaults to a `FALLBACK_SESSION` with no token, so authenticated flows such as messaging or bookings cannot load server data until a bootstrap script populates `window.__FIXNADO_SESSION__`. (`frontend-reactjs/src/hooks/useSession.js`).
- Dashboard routes like `/dashboards` and `/dashboards/:roleId` are publicly accessible; the unlock workflow trusts local persona state instead of server checks, so unauthenticated users can grant themselves dashboard access. (`frontend-reactjs/src/App.jsx`, `frontend-reactjs/src/pages/DashboardHub.jsx`).

## Usability & UX
- The lazy-loaded Suspense fallback is a spinner with no progress context; long-running routes (maps, analytics) will appear frozen for slow connections, breaching UX guidelines. (`frontend-reactjs/src/App.jsx`).
- Provider access denial page references translation keys (`providerStorefront.guard.*`) but provides no fallback text, so localisation failures render blank copy. (`frontend-reactjs/src/components/auth/ProviderProtectedRoute.jsx`).
- Session persistence merges dashboard arrays but preserves original casing, leading to duplicate entries like `Provider` vs `provider` in navigation menus. (`frontend-reactjs/src/hooks/useSession.js`).
- Once authenticated, the global footer disappears (`!isAuthenticated` guard) removing quick links to legal pages and help content that enterprise admins still expect in dashboards. (`frontend-reactjs/src/App.jsx`).

## Errors & Stability
- `App.jsx` injects dozens of lazy imports inside a single `Suspense` boundary; if any module throws during import, the entire app blanks without a granular error state despite `RouteErrorBoundary`. (`frontend-reactjs/src/App.jsx`).
- `useSession` only logs JSON parse failures to the console and keeps corrupted localStorage values, so the hook can loop on bad data until the user manually clears storage. (`frontend-reactjs/src/hooks/useSession.js`).
- The session hook exposes mutable state but does not debounce storage writes; rapid role changes (admin masquerade) will trigger thrashing renders. (`frontend-reactjs/src/hooks/useSession.js`).
- Persona storage utilities never validate payloads from `localStorage`, so tampered data can crash dashboards by feeding unexpected shapes into `usePersonaAccess`. (`frontend-reactjs/src/hooks/usePersonaAccess.js`).
- Client error telemetry posts return 404s during crashes, so `AppErrorBoundary` reports look successful but the network stack rejects them—leaving the UI in an error loop without feedback. (`frontend-reactjs/src/utils/errorReporting.js`, `backend-nodejs/src/routes/telemetryRoutes.js`).

## Integration & Data Flow
- The app assumes session context is synchronously available and never revalidates with `/api/auth/me`, so browser refreshes after token expiry leave the UI in an inconsistent authenticated state. (`frontend-reactjs/src/hooks/useSession.js`, `frontend-reactjs/src/api/sessionClient.js`).
- Provider storefront routes depend on backend panels that are mounted multiple times or behind missing middleware, leading to 404s or double logging until backend routing is fixed. (`frontend-reactjs/src/App.jsx`, `backend-nodejs/src/routes/index.js`).
- Offline session fallbacks are implemented, but they bypass actual network calls for critical operations like registration, risking divergence between client and server records. (`frontend-reactjs/src/api/sessionClient.js`).

## Security & Compliance
- Session state is read from `localStorage` without expiration or signature checks, so any script can escalate privileges by writing `window.localStorage['fx.session']`. (`frontend-reactjs/src/hooks/useSession.js`).
- `ProviderProtectedRoute` renders detailed guidance for unauthorised access but does not throttle retries, making it susceptible to enumeration when combined with backend audit logs. (`frontend-reactjs/src/components/auth/ProviderProtectedRoute.jsx`).
- Offline login helpers fall back to cached credentials whenever fetch fails, effectively allowing offline credential reuse without MFA. (`frontend-reactjs/src/api/sessionClient.js`).
- Persona unlocking is entirely client-side; `DashboardHub` calls `grantAccess` which mutates `localStorage` to enable roles with no server confirmation, so a malicious user can self-provision enterprise dashboards. (`frontend-reactjs/src/pages/DashboardHub.jsx`, `frontend-reactjs/src/hooks/usePersonaAccess.js`).
- The UI error boundaries render full stack traces, locations, and references directly to end users, exposing internals that aid attackers and leaking potentially sensitive metadata. (`frontend-reactjs/src/components/error/RouteErrorBoundary.jsx`, `frontend-reactjs/src/components/error/AppErrorBoundary.jsx`).

## Alignment & Roadmap Fit
- The sheer number of admin and provider routes suggests a monolithic panel, contradicting the roadmap ambition to ship scoped, persona-specific experiences in phases. (`frontend-reactjs/src/App.jsx`).
- Persisting sessions client-side without refresh logic conflicts with the update goal of hardening authentication before rolling out new provider features. (`frontend-reactjs/src/hooks/useSession.js`).
- Offline session stubs target demo environments rather than production readiness, misaligning with the update’s emphasis on enterprise onboarding quality. (`frontend-reactjs/src/api/sessionClient.js`).

## Performance & Scalability
- `App.jsx` mounts `FloatingChatLauncher` and other global widgets on every route, so even read-only pages load chat infrastructure that should be lazy behind feature flags. (`frontend-reactjs/src/App.jsx`).
- The session hook re-reads and freezes large dashboard arrays on every focus event, forcing unnecessary renders for dashboards-heavy personas. (`frontend-reactjs/src/hooks/useSession.js`).
- Route-level data fetching is absent; instead the app relies on client caches, which leads to oversized bundles and repeated hydration work as more modules are added. (`frontend-reactjs/src/App.jsx`).
- Persona unlock calls trigger synchronous `setAllowed` writes for every click, spamming `localStorage` events across tabs and causing redundant re-renders in large teams. (`frontend-reactjs/src/hooks/usePersonaAccess.js`).

## Observability & Tooling
- There is no client-side telemetry around route transitions or session refreshes, so UX teams cannot observe drop-off or identify failing panels. (`frontend-reactjs/src/App.jsx`, `frontend-reactjs/src/hooks/useSession.js`).
- Error boundaries log to the console but do not integrate with any monitoring SDK, making silent failures in lazy imports hard to diagnose. (`frontend-reactjs/src/components/error/RouteErrorBoundary.jsx`).
- The build scripts lack bundle analysis tooling, so the impact of large dependencies (MapLibre, Turf) is invisible during review. (`frontend-reactjs/package.json`).
- Persona unlock flows fire no analytics events, making it impossible to know which dashboards users access or whether self-provisioning is being abused. (`frontend-reactjs/src/pages/DashboardHub.jsx`).
- Crash telemetry attempts to hit `/api/telemetry/client-errors`, but no backend handler exists, so the only diagnostic channel for browser failures is currently dead. (`frontend-reactjs/src/utils/errorReporting.js`, `backend-nodejs/src/routes/telemetryRoutes.js`).

## Recommendations
- Break `App.jsx` into persona-specific routers with feature flags so inactive routes do not ship by default.
- Introduce a session bootstrap effect that revalidates `/api/auth/me`, clears corrupted storage, and enforces expirations.
- Gate offline fallbacks behind explicit demo mode toggles, add telemetry around route loads, and lazy load global widgets to preserve performance.
