# Front-end Change Log

## Error reporting upgrades (Version 1.00)
- Expanded the React telemetry reporter to attach release metadata, correlation identifiers, sanitised breadcrumbs, and session context before posting to `/v1/telemetry/client-errors`, while enforcing payload limits that mirror backend validators.【F:frontend-reactjs/src/utils/errorReporting.js†L1-L278】

## Geospatial stack rationalisation (Version 1.00)
- Replaced CDN-driven MapLibre bootstrapping and Mapbox Draw/Turf helpers with a dynamic loader, Terra Draw adapters, and shared GeoJSON utilities so zone drawing and explorer maps initialise asynchronously, deduplicate polygons, and stay tree-shakeable across builds.【F:frontend-reactjs/src/lib/mapLibreLoader.js†L1-L32】【F:frontend-reactjs/src/lib/geojson.js†L1-L160】【F:frontend-reactjs/src/components/zones/ZoneDrawingMap.jsx†L1-L200】【F:frontend-reactjs/src/components/explorer/ExplorerMap.jsx†L1-L200】【F:frontend-reactjs/src/pages/explorerUtils.js†L1-L200】
- Added a dedicated analysis entry, Vite configuration, and CI script that generate bundle artefacts on demand, enforce MapLibre chunk isolation, and fail builds when deprecated Mapbox/Turf modules resurface.【F:frontend-reactjs/src/analyzeMapEntry.jsx†L1-L12】【F:frontend-reactjs/vite.analyze.config.js†L1-L15】【F:frontend-reactjs/vite.config.js†L1-L45】【F:scripts/analyze-frontend-bundle.mjs†L1-L78】

## Persona and legal surface stability (Version 1.00)
- Refactored the persona profile page to centralise persona switching, stats computation, and sharing modals, restoring JSX balance after the geospatial migration and delivering consistent overlays, refresh controls, and timezone badges for every persona theme.【F:frontend-reactjs/src/pages/Profile.jsx†L340-L758】【F:frontend-reactjs/src/pages/Profile.jsx†L1088-L1151】
- Ensured provider dashboards respect hook ordering by moving callbacks ahead of guard returns and tightening navigation memoisation so website preference updates persist without React warnings.【F:frontend-reactjs/src/pages/ProviderDashboard.jsx†L466-L558】【F:frontend-reactjs/src/pages/ProviderDashboard.jsx†L620-L702】
- Introduced an explicit loading state and reinforced document fallbacks on the Terms page, keeping modal navigation and metadata resets functional even when the remote CMS is unavailable.【F:frontend-reactjs/src/pages/Terms.jsx†L209-L360】

## Routing & telemetry resilience (Version 1.00)
- Broke the monolithic router into persona-scoped shells with contextual loaders, resilient error boundaries, and navigation telemetry so workspace transitions emit structured events for `/api/telemetry/client-errors` while isolating admin, provider, serviceman, and public fallbacks.【F:frontend-reactjs/src/App.jsx†L1-L205】【F:frontend-reactjs/src/routes/layouts/PersonaShell.jsx†L1-L72】【F:frontend-reactjs/src/routes/components/PersonaRouteLoader.jsx†L1-L66】【F:frontend-reactjs/src/routes/RouteTelemetryProvider.jsx†L1-L55】【F:frontend-reactjs/src/utils/navigationTelemetry.js†L1-L141】

## Session and persona governance (Version 1.00)
- Replaced the local-storage-only session hook with a `/api/auth/me` bootstrap, cached profile normalisation, persona-aware storage throttling, and telemetry dispatch so browser refreshes, offline fallbacks, and multi-tab usage all respect server-driven unlocks.【F:frontend-reactjs/src/hooks/useSession.js†L1-L331】【F:frontend-reactjs/src/utils/sessionStorage.js†L1-L289】【F:frontend-reactjs/src/utils/personaStorage.js†L1-L223】
- Hardened persona access utilities, the persona provider, and the dashboard hub unlock flow to honour server-allowed personas, emit analytics when blocks occur, and expose deterministic UX copy for denied roles.【F:frontend-reactjs/src/hooks/usePersonaAccess.js†L1-L86】【F:frontend-reactjs/src/providers/PersonaProvider.jsx†L1-L99】【F:frontend-reactjs/src/pages/DashboardHub.jsx†L12-L72】
