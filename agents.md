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

## Task 3 – Frontend API, hooks, and shared utility fixes
- `src/api/affiliateClient.js`: `error` defined but never used at line 66 (`no-unused-vars`).
- `src/api/analyticsDashboardClient.js`: `_headers` and `_credentials` assigned but unused at line 52; `parseError` defined but unused at lines 65 and 108 (`no-unused-vars`).
- `src/api/authClient.js`: `error` defined but never used at line 34 (`no-unused-vars`).
- `src/api/communicationsClient.js`: `error` defined but never used at line 27 (`no-unused-vars`).
- `src/api/geoMatchingClient.js`: `error` defined but never used at line 46 (`no-unused-vars`).
- `src/components/Header.jsx`: `useMemo` dependency warning — unnecessary dependency `locale` at line 149 (warning `react-hooks/exhaustive-deps`).
- `src/components/blog/BlogCard.jsx`: `error` defined but never used at line 14 (`no-unused-vars`).
- `src/components/blog/BlogHero.jsx`: `error` defined but never used at line 12 (`no-unused-vars`).
- `src/components/dashboard/DashboardSection.jsx`: Missing PropTypes validation for `section.access` at line 935 (`react/prop-types`).
- `src/components/explorer/ExplorerResultList.jsx`: `error` defined but never used at line 15 (`no-unused-vars`).
- `src/hooks/useRoleAccess.js`: Improper hook usage in `legacyUseRoleAccess` — `useState` (line 58), `useEffect` (line 60), and multiple `useMemo` calls (lines 98, 99, 101) called from non-hook function (`react-hooks/rules-of-hooks`).
- `src/i18n/locales/en-GB.js`: Duplicate key `businessFront.reviewScoreLabel` at line 542 (`no-dupe-keys`).
- `src/pages/BlogPost.jsx`: `error` defined but never used at line 15 (`no-unused-vars`).
- `src/pages/BusinessFront.jsx`: `SwatchIcon` defined but never used at line 21 (`no-unused-vars`); `useMemo` dependency warning for `styleGuide` memoization at line 913 (warning `react-hooks/exhaustive-deps`).
- `src/pages/GeoMatching.jsx`: Multiple missing PropTypes validations for `option`, `checked`, `onChange`, `match`, `formats`, and nested properties at lines 41–141 (`react/prop-types`).
- `src/pages/ProviderDashboard.jsx`: Extensive missing PropTypes validations for `icon`, `label`, `value`, `caption`, `tone`, `toneLabel`, `data-qa`, `alert` (and nested fields), `member` (and nested fields), `booking` (and nested fields), `metric` (and nested fields), `column` (and nested fields), `pkg` (and nested fields), `category` (and nested fields), and `service` (and nested fields) across lines 24–347 (`react/prop-types`).
- `src/pages/RoleDashboard.jsx`: Parsing error — Unexpected token `finally` at line 118.
- `src/pages/Search.jsx`: `refreshToken` assigned but never used at line 136 (`no-unused-vars`).
- `src/pages/Tools.jsx`: `toggle` assigned but never used at line 133 (`no-unused-vars`).
- `src/pages/explorerUtils.js`: `zonesByCompany` defined but never used at line 84 (`no-unused-vars`).
- `src/providers/__tests__/ThemeProvider.test.jsx`: `global` is not defined at lines 31 and 70 (`no-undef`).

## Task 4 – Frontend page & test suite corrections
- `src/pages/GeoMatching.jsx`: Remaining PropTypes errors for `match.zone.name`, `match.zone.demandLevel`, `match.reason`, `match.score`, `match.score.toFixed`, `match.zone.company`, `match.zone.company.contactName`, `match.distanceKm`, `match.distanceKm.toFixed`, `match.services`, `match.services.length`, `match.services.map`, `formats.currency`, `status`, `copy`, `badge`, `retryLabel`, `loginLabel`, `onRetry`, `copy.title`, and `copy.message` at lines 66–141 (`react/prop-types`).
- `src/pages/ProviderDashboard.jsx`: Additional PropTypes errors for `alert.actionLabel`, `member.availability`, `member.rating`, `member.id`, `member.name`, `member.role`, `booking.eta`, `booking.id`, `booking.client`, `booking.service`, `booking.value`, `booking.zone`, `metric.format`, `metric.value`, `metric.caption`, `metric.target`, `metric.id`, `metric.label`, `column.id`, `column.title`, `column.items`, `column.description`, `column.items.length`, `column.items.map`, `pkg.price`, `pkg.currency`, `pkg.id`, `pkg.name`, `pkg.description`, `pkg.highlights`, `pkg.highlights.length`, `pkg.highlights.map`, `pkg.serviceName`, `category.performance`, `category.id`, `category.type`, `category.label`, `category.description`, `category.activeServices`, `service.price`, `service.currency`, `service.availability`, `service.availability.detail`, `service.availability.label`, `service.id`, `service.type`, `service.name`, `service.description`, `service.category`, `service.tags`, `service.tags.length`, `service.tags.slice`, `service.coverage`, `service.coverage.length`, and `service.coverage.slice` across lines 53–347 (`react/prop-types`).
- `src/pages/GeoMatching.jsx`: PropTypes errors for `match.services` iterations and `match.zone.company` nested properties at lines 80–94 (`react/prop-types`).
- `src/pages/ProviderDashboard.jsx`: PropTypes errors for nested arrays and metrics at lines 179–347 (`react/prop-types`).
- `src/pages/RoleDashboard.jsx`: Parsing error `finally` at line 118 (reiterated for focus).
- `src/pages/__tests__/About.test.jsx`: Missing globals `describe`, `it`, and `expect` at lines 5–35 (`no-undef`).
- `src/pages/__tests__/RoleDashboard.test.jsx`: Parsing error — Unexpected token `.` at line 113.
- `src/pages/__tests__/Terms.test.jsx`: Missing globals `describe`, `it`, and `expect` at lines 7–23 (`no-undef`).

## Task 5 – Flutter phone app dependency resolution
- `pubspec.yaml`: Bump `intl` to `^0.20.2` so it aligns with the version required by `flutter_localizations` and allows `flutter pub get` / `flutter analyze` to proceed once the Flutter SDK is available.
- `pubspec.yaml`: `google_fonts ^6.3.2` currently requires Dart SDK `^3.7.0`, but Flutter 3.27.1 bundles Dart 3.6.0; running `flutter analyze` fails during pub resolution until either the dependency is downgraded or the toolchain is upgraded.

> **Notes:**
> - All backend findings sourced from `npm run lint` executed within `backend-nodejs` (33 errors, 7 warnings).
> - All frontend findings sourced from `npm run lint` executed within `frontend-reactjs` (175 errors, 2 warnings).
> - Flutter findings sourced from `flutter analyze` within `flutter-phoneapp`; analysis currently fails because `google_fonts` requires Dart `^3.7.0` while the bundled Dart SDK is 3.6.0.
> - Warnings are included where reported to ensure full visibility.
