# UI Preference Telemetry Dashboard

## Overview
The UI preference telemetry service captures every theme, density, contrast, and marketing variant change performed in Theme Studio. Events are persisted for analytics and surfaced via the summary endpoint so product, design, and data teams can validate adoption trends.

## Data Flow
1. **Client Instrumentation** – `ThemeProvider` emits the `theme_change` dataLayer event, dispatches the `fixnado:theme-change` DOM event, and sends a beacon to `/api/telemetry/ui-preferences` with contextual metadata (tenant, role, locale, correlationId, userAgent).
2. **API Ingestion** – The Node.js backend validates payloads, hashes source IPs for privacy, and stores records in the `ui_preference_telemetry` table with UUID identifiers and ISO8601 timestamps.
3. **Analytics Access** – Aggregated metrics are exposed at `/api/telemetry/ui-preferences/summary`, allowing dashboards (Looker, Metabase) to query adoption by theme, density, contrast, or marketing variant across configurable time ranges.

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

## Dashboard Guidance
- **Looker Explore:** Create a derived table that calls the summary endpoint hourly and stores the JSON payload for historical comparison.
- **Alerts:** Trigger alerts when adoption of `emo` theme drops below 10% of events for enterprise tenants or when no events arrive for >2 hours.
- **Data Governance:** IP addresses are hashed server-side; correlation IDs allow joining with session logs without storing PII.

## Operational Runbook
- Monitor API health via `/api/telemetry/ui-preferences/summary?range=1d`. A zero `events` count across working hours indicates instrumentation failure.
- Roll new telemetry schema versions by bumping `dataVersion` from the client; backend accepts semantic versions up to 16 characters.
- Coordinate schema changes with data engineering – update `fx-theme-preferences.json` `payloadSchema` and notify analytics via the #design-telemetry channel.
