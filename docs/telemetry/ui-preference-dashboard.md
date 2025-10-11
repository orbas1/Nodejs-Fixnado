# UI Preference Telemetry Dashboard

## Overview
The UI preference telemetry service captures every theme, density, contrast, and marketing variant change performed in Theme Studio. Events are persisted for analytics and surfaced via the summary endpoint so product, design, and data teams can validate adoption trends.

## Data Flow
1. **Client Instrumentation** – `ThemeProvider` emits the `theme_change` dataLayer event, dispatches the `fixnado:theme-change` DOM event, and sends a beacon to `/api/telemetry/ui-preferences` with contextual metadata (tenant, role, locale, correlationId, userAgent).
2. **API Ingestion** – The Node.js backend validates payloads, hashes source IPs for privacy, and stores records in the `ui_preference_telemetry` table with UUID identifiers and ISO8601 timestamps.
3. **Analytics Access** – Aggregated metrics are exposed at `/api/telemetry/ui-preferences/summary`, allowing dashboards (Looker, Metabase) to query adoption by theme, density, contrast, or marketing variant across configurable time ranges. Persisted snapshots are available through `/api/telemetry/ui-preferences/snapshots` so BI tooling can ingest governed records without hitting live aggregation endpoints.

## API Contracts
### `POST /api/telemetry/ui-preferences`
- **Purpose:** Persist a single preference change event.
- **Auth:** Public within authenticated session context (intended for same-origin beacons).
- **Validation:**
  - `theme`: enum `standard | dark | emo`
  - `density`: enum `compact | comfortable`
  - `contrast`: enum `standard | high`
  - `marketingVariant`: string ≤ 64 chars *(default `default`)*
  - `tenantId`: string ≤ 64 chars *(default `fixnado-demo`)*
  - `role`: string ≤ 32 chars *(default `unknown`)*
  - `timestamp`: ISO8601 *(default server time)*
  - `dataVersion`: semantic version *(default `1.0.0`)*
- **Response:** `202 Accepted` with event `id` and `receivedAt` timestamp.

### `GET /api/telemetry/ui-preferences/summary`
- **Purpose:** Provide aggregated counts for dashboards.
- **Query Params:**
  - `range`: `1d | 7d | 30d` *(default `7d`)*
  - `tenantId`: optional tenant filter
- **Response:**
  - `range`: requested window key plus ISO8601 start/end
  - `totals.events`: total ingested events
  - `breakdown`: counts by theme, density, contrast, marketingVariant
  - `timeseries`: daily totals with per-theme breakdown
- `latestEventAt`: ISO timestamp for freshness monitoring

### `GET /api/telemetry/ui-preferences/snapshots`
- **Purpose:** Provide paginated access to persisted telemetry summaries for BI ingestion.
- **Query Params:**
  - `rangeKey`: optional range filter (e.g. `1d`, `7d`, `30d`, `6h`), defaults to all.
  - `tenantId`: optional tenant filter for future multi-tenant segmentation.
  - `capturedAfter` / `capturedBefore`: ISO8601 timestamps to constrain the capture window.
  - `limit`: page size (default 200, max 1000).
  - `cursor`: base64url encoded token returned in `pagination.nextCursor` to fetch the next page without duplication.
- **Response:**
  - `snapshots`: ordered array (oldest → newest) containing metadata (`capturedAt`, `rangeStart`, `rangeEnd`, `events`, `emoShare`, `leadingTheme`, `staleMinutes`, `payload`).
  - `pagination`: `limit`, `hasMore`, and `nextCursor` (supply on subsequent requests).
- **Usage Tips:** Start ingestion with `capturedAfter` equal to the last successfully processed `capturedAt` to support idempotent pipelines. Store the cursor between runs to handle duplicates gracefully.

## Dashboard Guidance
- **Looker Explore:** Create a derived table that consumes `/api/telemetry/ui-preferences/snapshots` every 15 minutes. Persist `capturedAt`, `rangeKey`, `events`, `emoShare`, and the raw JSON payload to enable historical comparisons and avoid hammering live APIs.
- **Alerts:** Trigger alerts when adoption of `emo` theme drops below 10% of events for enterprise tenants or when no events arrive for >2 hours.
- **Data Governance:** IP addresses are hashed server-side; correlation IDs allow joining with session logs without storing PII.

## Front-end Operations Console (React)
- **Route:** `/admin/telemetry` within the React application provides operations, design, and QA teams with a first-party telemetry view ahead of Looker roll-out.
- **Range Controls:** Segmented control for `24 hours`, `7 days`, and `30 days` windows drives calls to `GET /api/telemetry/ui-preferences/summary`. The hook auto-refreshes every 5 minutes, pausing when the tab is hidden.
- **Summary Cards:** Cards surface total events ingested, the leading theme (with delta vs. second place), and freshness status based on the latest event timestamp. When no events arrive for two hours the page elevates a warning state.
- **Trend Visualisation:** `TrendChart` plots daily totals, with CSV export enabling ad-hoc analysis and Looker backfill checks. Exports include range metadata, totals, and theme breakdown counts.
- **Breakdowns:** Dedicated panels summarise theme, density, and marketing variant share with progress indicators that align with the blueprint documented in `web_application_design_update/version_1.00_update/Dashboard Designs.md`.
- **Operational Summary:** A final card translates the API response into human-readable range, latest-event, next-refresh, and volume statements so operations can validate SLAs during incident triage.

## QA & Alerting Hooks
- **Automation Selectors:** `data-qa` attributes (`telemetry-summary.*`, `telemetry-breakdown.*`, `telemetry-chart`) have been added for Playwright coverage (see `docs/design/handoff/ui-qa-scenarios.csv`).
- **Staleness Threshold:** The UI mirrors the runbook SLA, highlighting stale telemetry when the latest event exceeds 120 minutes or no events have been captured.
- **Developer Sandbox:** In non-production builds a "Load sample dataset" action hydrates the dashboard with realistic seed data so designers and QA can exercise flows without a live backend.
- **Alert Routing:** Background job posts to #design-telemetry when no events arrive for ≥120 minutes or emo adoption drops below 10% (≥50 events). Looker alerts can consume the same snapshot table for redundancy.

## Background Alerting Service
- **Location:** `backend-nodejs/src/jobs/telemetryAlertJob.js` executes on API startup, polling `summariseUiPreferenceEvents` every 15 minutes (configurable via `TELEMETRY_ALERT_INTERVAL_MINUTES`).
- **Thresholds:** Defaults—stale ≥120 minutes (`TELEMETRY_STALE_MINUTES`), emo share minimum 0.1 (`TELEMETRY_EMO_SHARE_MINIMUM`), repeat suppression 60 minutes (`TELEMETRY_ALERT_REPEAT_MINUTES`), minimum volume 50 events (`TELEMETRY_MIN_EVENTS_FOR_SHARE`).
- **Slack Delivery:** Configure `TELEMETRY_SLACK_WEBHOOK_URL` with the incoming webhook for #design-telemetry. Messages include Block Kit copy, thresholds, last-event timestamps, and runbook references. Resolution messages fire once metrics recover.
- **Error Handling:** Failures to fetch or post log to the server console; alerts retry on the next interval without duplicating messages unless the state changes or the repeat window elapses.

- **Model:** `UiPreferenceTelemetrySnapshot` captures rolling-window metrics (range, events, emo share, leading theme, staleness minutes) plus the raw JSON payload. Table creation handled through model sync on job start.
- **Usage:** Looker can ingest snapshots via the `/api/telemetry/ui-preferences/snapshots` endpoint on a schedule, enabling historical trend comparisons without querying live APIs. The runbook recommends ingestion every 15 minutes in staging and production to align with alert cadence.
- **Retention & Governance:** Data engineering owns retention policies; snapshots exclude PII (IP hashes remain hashed). Column metadata is documented for metric catalogue updates.

## Operational Runbook
- Monitor API health via `/api/telemetry/ui-preferences/summary?range=1d`. A zero `events` count across working hours indicates instrumentation failure.
- Roll new telemetry schema versions by bumping `dataVersion` from the client; backend accepts semantic versions up to 16 characters.
- Coordinate schema changes with data engineering – update `fx-theme-preferences.json` `payloadSchema` and notify analytics via the #design-telemetry channel.
