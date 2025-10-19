# Front-end Page Updates

## Profile (Version 1.00)
- Unified persona switching, stats derivation, and hero actions inside `Profile.jsx`, removing duplicate imports and wiring refresh/share utilities so every persona renders consistent badges, timezone metadata, and overlays.【F:frontend-reactjs/src/pages/Profile.jsx†L340-L758】【F:frontend-reactjs/src/pages/Profile.jsx†L1088-L1151】

## Provider Dashboard (Version 1.00)
- Normalised hook ordering by defining memoised callbacks before early returns, ensuring website preference updates persist and navigation metadata recomputes without tripping React's hook rules.【F:frontend-reactjs/src/pages/ProviderDashboard.jsx†L466-L558】【F:frontend-reactjs/src/pages/ProviderDashboard.jsx†L620-L702】

## Terms & Policies (Version 1.00)
- Added a resilient loading state and reinforced CMS fallbacks around section navigation so legal content and modal views initialise even when remote fetches fail.【F:frontend-reactjs/src/pages/Terms.jsx†L209-L360】

## Dashboard Hub & session bootstrap (Version 1.00)
- Updated the dashboard hub unlock flow to respect server-approved personas, surface approval messaging when blocked, and synchronise persona analytics so manual grants can no longer bypass admin controls.【F:frontend-reactjs/src/pages/DashboardHub.jsx†L12-L72】
- Replaced the client-only session bootstrap with an authenticated `/api/auth/me` fetch, persona-aware storage throttling, and telemetry instrumentation to keep persona unlocks and offline fallbacks in sync across tabs.【F:frontend-reactjs/src/hooks/useSession.js†L1-L331】【F:frontend-reactjs/src/utils/sessionStorage.js†L1-L289】
