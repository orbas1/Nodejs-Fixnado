# Lint Error Audit Tasks

This document captures the complete set of lint findings from running `npm run lint` in both the backend (`backend-nodejs`) and frontend (`frontend-reactjs`) workspaces. The issues are partitioned into four task groups so they can be tackled iteratively.

## Task 1 – Backend environment & syntax corrections *(completed)*
- ✅ `scripts/bootstrap-postgis.mjs`: Declare Node globals so ESLint recognises `process` and `console`.
- ✅ `src/controllers/zoneController.js`: Restore missing braces for zone service handlers so `export` statements stay at the module top level.
- ✅ `src/routes/panelRoutes.js`: Reconcile duplicate router declarations and auth wiring.
- ✅ `src/routes/zoneRoutes.js`: Fix import list separator for `matchGeoZoneHandler` / `previewCoverageHandler` exports.
- ✅ `src/services/dashboardAnalyticsService.js`: Rebuild the `loadProviderData` async aggregator after conflict damage.
- ✅ `src/services/panelService.js`: Repair helper definitions and review summary section after conflict damage.

## Task 2 – Backend cleanup of unused variables & configuration warnings *(completed)*
- ✅ `src/database/migrations/20250217000000-create-inventory-and-rentals.js`: Removed the redundant `no-await-in-loop` disable now that the loop conforms without it.
- ✅ `src/database/migrations/20250218000000-compliance-and-marketplace-moderation.js`: Trimmed the unused `Sequelize` destructuring from the down migration.
- ✅ `src/database/migrations/20250219000000-create-campaign-manager.js`: Dropped the unused `Sequelize` binding from the rollback routine.
- ✅ `src/database/migrations/20250302000000-upgrade-service-zones.js`: Switched the JSON parse guard to `catch { ... }` so no unused error variable lingers.
- ✅ `src/jobs/analyticsIngestionJob.js`: Deleted unnecessary `no-await-in-loop` suppressions while keeping the sequential awaits.
- ✅ `src/models/user.js`: Consolidated the `type` enum into a single declaration with the combined role list.
- ✅ `src/services/adminDashboardService.js`: Removed the unused `sequelize` import and stale `no-await-in-loop` directives.
- ✅ `src/services/analyticsEventService.js`: Batched event writes with `Promise.all`, eliminating the need for per-iteration disables.
- ✅ `src/services/campaignService.js`: Dropped the unused helper state and renamed the optional `metricDate` binding to `_metricDate` to satisfy linting.
- ✅ `src/services/communicationsService.js`: Simplified the quiet-hour regex literal, clarified the validation error message, and removed the redundant message self-assignment.
- ✅ `src/services/zoneService.js`: Adopted a bare `catch {}` for GeoJSON parsing to avoid unused error bindings.
- ✅ `tests/analyticsDashboards.test.js`: Avoided the unused conversation binding while preserving fixture setup.
- ✅ `tests/analyticsPipelineRoutes.test.js`: Converted teardown guards to `catch {}` blocks so no unused variables remain.
- ✅ `tests/bookingRoutes.test.js`: Mirrored the teardown guard cleanup.
- ✅ `tests/campaignRoutes.test.js`: Applied the same teardown guard fix.
- ✅ `tests/communicationsRoutes.test.js`: Cleared the teardown error binding.
- ✅ `tests/complianceMarketplace.test.js`: Matched the teardown guard adjustments.
- ✅ `tests/panelRoutes.test.js`: Reconciled merge-conflict leftovers to remove redeclarations and stabilise the suite.
- ✅ `tests/rentalRoutes.test.js`: Updated the teardown guard to drop the unused error binding.
- ✅ `tests/zoneRoutes.test.js`: Switched to a bare `catch {}` in teardown.
- ✅ `vitest.setup.js`: Relied on Vitest’s global `vi` helper instead of importing from a dev-only dependency.

## Task 3 – Frontend API, hooks, and shared utility fixes *(completed)*
- ✅ `src/api/affiliateClient.js`: Switched the error-body parse fallback to a bare `catch {}` so no unused variable remains.
- ✅ `src/api/analyticsDashboardClient.js`: Forwarded optional headers/credentials and dropped unused destructures while converting JSON parse fallbacks to bare catches.
- ✅ `src/api/authClient.js`: Removed the unused error binding in the response parsing guard.
- ✅ `src/api/communicationsClient.js`: Simplified the response error handler to avoid the unused `error` binding.
- ✅ `src/api/geoMatchingClient.js`: Used a bare catch when parsing the error body to satisfy `no-unused-vars`.
- ✅ `src/components/Header.jsx`: Removed the redundant `locale` dependency and destructure to clear the exhaustive-deps warning.
- ✅ `src/components/blog/BlogCard.jsx`: Updated the date formatter to use a bare catch so the unused error binding is gone.
- ✅ `src/components/blog/BlogHero.jsx`: Mirrored the bare catch change for the featured blog hero formatter.
- ✅ `src/components/dashboard/DashboardSection.jsx`: Added PropTypes coverage for `section.access` via the ads section prop validation.
- ✅ `src/components/explorer/ExplorerResultList.jsx`: Dropped the unused error binding in the currency formatter.
- ✅ `src/hooks/useRoleAccess.js`: Promoted `legacyUseRoleAccess` to the properly named `useLegacyRoleAccess` hook while keeping hook usage legal.
- ✅ `src/i18n/locales/en-GB.js`: Split the duplicate `reviewScoreLabel` key into `reviewScoreLabel` and `reviewScoreTitle` to remove the duplicate key warning.
- ✅ `src/pages/BlogPost.jsx`: Converted the date formatter to a bare catch to avoid the unused error parameter.
- ✅ `src/pages/BusinessFront.jsx`: Removed the unused `SwatchIcon` import and memoised the style guide source before deriving palette entries.
- ✅ `src/pages/GeoMatching.jsx`: Declared PropTypes for the demand toggle, match card, and access gate components while importing PropTypes.
- ✅ `src/pages/ProviderDashboard.jsx`: Added comprehensive PropTypes for all dashboard subcomponents and imported PropTypes at the module head.
- ✅ `src/pages/RoleDashboard.jsx`: Rebuilt the dashboard container to resolve the parsing error and streamline access/toggle orchestration.
- ✅ `src/pages/Search.jsx`: Stripped the unused `refreshToken` destructure by cloning and deleting the property before normalising filters.
- ✅ `src/pages/Tools.jsx`: Removed the unused `toggle` destructure from the tools feature toggle evaluation.
- ✅ `src/pages/explorerUtils.js`: Simplified zone filtering by removing the unused `zonesByCompany` parameter.
- ✅ `src/providers/__tests__/ThemeProvider.test.jsx`: Referenced `globalThis.fetch` instead of `global` in setup and assertions.
- ✅ `src/pages/__tests__/About.test.jsx`: Imported Vitest globals so `describe`/`it`/`expect` are defined.
- ✅ `src/pages/__tests__/Terms.test.jsx`: Added the Vitest global imports for describe/it/expect.
- ✅ `src/pages/__tests__/RoleDashboard.test.jsx`: Replaced the conflicted fixture with a lean mocked suite that exercises the new dashboard container.

## Task 4 – Frontend page & test suite corrections *(completed)*
- ✅ `src/components/communications/MessageComposer.jsx`: Restored the accessible "Request AI assist" label while keeping the updated UI copy and moved default prop fallbacks into parameter defaults so Vitest can toggle the AI request flow without warnings.
- ✅ `src/components/ui/Spinner.jsx`: Replaced `defaultProps` with parameter defaults to silence React’s future deprecation warning during the communications suite run.
- ✅ `src/components/ui/Skeleton.jsx`: Dropped the redundant `defaultProps` wrapper now that the spinner/skeleton tests rely on intrinsic defaults.
- ✅ `src/pages/BusinessFront.jsx`: Converted the marketing chip helper to default its icon via parameters, eliminating the outstanding `defaultProps` warning when the Business Front tests render the access gate.
- ✅ Validation: `npx vitest run src/components/communications/__tests__/MessageComposer.test.jsx` now passes, confirming the AI assist toggle scenario is exercised successfully.

## Task 5 – Flutter phone app dependency resolution *(completed)*
- ✅ `pubspec.yaml`: Bump `intl` to `^0.20.2` so it aligns with the version required by `flutter_localizations` and allows `flutter pub get` / `flutter analyze` to proceed once the Flutter SDK is available.
- ✅ `pubspec.yaml`: Pin `google_fonts` to `^6.2.1`, which supports the bundled Dart 3.6.0 SDK so `flutter analyze` can run without a pub resolution failure.
- ✅ `pubspec.lock`: Sync the manual lock entry with the downgraded `google_fonts` version for consistency until `flutter pub get` is executed in a full Flutter environment.

> **Notes:**
> - All backend findings sourced from `npm run lint` executed within `backend-nodejs` (33 errors, 7 warnings).
> - All frontend findings sourced from `npm run lint` executed within `frontend-reactjs` (175 errors, 2 warnings).
> - Flutter findings sourced from `flutter analyze` within `flutter-phoneapp`; analysis currently fails because `google_fonts` requires Dart `^3.7.0` while the bundled Dart SDK is 3.6.0.
> - Warnings are included where reported to ensure full visibility.

## Screenshot Log

- ✅ `frontend-reactjs`: Captured the home dashboard state via Vite dev server for regression tracking (`browser:/invocations/maucghct/artifacts/artifacts/frontend-home.png`).
- ✅ `frontend-reactjs`: Rebuilt the authenticated header to surface Feed, Explorer, and Marketplace shortcuts with notification/message trays and captured the refreshed experience (`browser:/invocations/gwqjucpw/artifacts/artifacts/feed-header.png`).
- ✅ `frontend-reactjs`: Refreshed the public home page hero and service showcases with photography and recorded the update (`browser:/invocations/ybitctzc/artifacts/artifacts/home-refresh.png`).
- ✅ `frontend-reactjs`: Streamlined the marketplace home with a single crane hero, tidy service showcases, and documented the update (`browser:/invocations/etgbcwhy/artifacts/artifacts/homepage-refresh.png`).
- ✅ `frontend-reactjs`: Rebuilt the home experience with a crane-focused hero, refreshed service gallery, and documented the layout (`browser:/invocations/uyckzkst/artifacts/artifacts/homepage-rebuild.png`).
- ✅ `frontend-reactjs`: Updated the hero with the client-provided crane image and captured the refreshed landing view (`browser:/invocations/pxvjmvyt/artifacts/artifacts/home-hero-update.png`).
