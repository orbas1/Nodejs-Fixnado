# Telemetry Alerting & Looker Snapshot Enablement — Version 1.00

## Overview
Version 1.00 extends the telemetry programme beyond the admin console by introducing a production alerting pipeline and BI-ready snapshots. The new background job polls the telemetry summary endpoint, enforces freshness/adoption SLAs, and persists governed payloads so Looker dashboards and operations teams can act on reliable data. This document captures design intent, operational guardrails, and follow-up actions for DT7.

## Objectives
- **Protect telemetry freshness:** Detect gaps exceeding 120 minutes and notify the #design-telemetry Slack channel with actionable steps and runbook references.
- **Monitor emo theme adoption:** Flag drops below 10% share (with minimum event thresholds) to unblock marketing/legal responses before campaign metrics degrade.
- **Feed analytics tooling:** Persist rolling snapshots that expose totals, shares, and raw payload JSON for Looker ingestion without hammering production APIs.

## Alerting Experience
- **Polling cadence:** The job evaluates telemetry every 15 minutes, pausing repeats for at least 60 minutes unless conditions change, preventing notification fatigue.
- **Slack messaging:** Alerts use Block Kit messages featuring summary copy, thresholds, last event timestamps, and runbook links. Recovery messages confirm resolution.
- **Governance:** Thresholds, evaluation range, repeat window, and minimum event counts are environment-configurable through `TELEMETRY_*` variables, enabling staging rehearsal before production roll-out.

## Analytics Snapshots
- **Schema:** `UiPreferenceTelemetrySnapshot` stores captured_at, range window, tenantId, total events, emo share, leading theme metadata, staleness minutes, and a JSON payload replicating the API response.
- **Usage:** Looker can ingest snapshots on a timed basis, unlocking historical comparisons and avoiding real-time API dependencies. Data teams can materialise additional views per tenant once multi-tenant support lands.
- **Retention:** Snapshots are persisted continuously, enabling data engineering to define retention/archival policies without modifying the job. Future work may prune data older than 90 days.

## Operational Runbook
- **Configuration:** Set `TELEMETRY_SLACK_WEBHOOK_URL` to the #design-telemetry incoming webhook. Optional overrides include `TELEMETRY_STALE_MINUTES`, `TELEMETRY_EMO_SHARE_MINIMUM`, `TELEMETRY_ALERT_INTERVAL_MINUTES`, `TELEMETRY_ALERT_REPEAT_MINUTES`, and `TELEMETRY_MIN_EVENTS_FOR_SHARE`.
- **Rehearsal:** QA scripts in `docs/design/handoff/ui-qa-scenarios.csv` include alert simulation by backdating telemetry payloads. Ops should dry-run Slack alerts in staging before go-live.
- **Escalation:** Alert messages reference `docs/telemetry/ui-preference-dashboard.md` for detailed diagnostics—checking Theme Studio beacons, API health, database connectivity, and marketing presets.

## QA & Validation
- Automated Playwright scenarios assert that alerts trigger when the dashboard surfaces stale warnings, and that Slack payloads match expected text (via webhook mock).
- Manual QA verifies snapshot rows persist after job execution, using seeded data and the development sample dataset loader.
- Security review confirms hashed IPs remain intact and no PII enters Slack payloads; only aggregate metrics are transmitted.

## Future Enhancements
1. **Tenant Segmentation:** Extend job to fan out per tenant once multi-tenant analytics lands in Version 1.01.
2. **Chromatic Baseline:** Capture visual regressions for `/admin/telemetry` with alert banners to ensure UI + alerting state remain accessible.
3. **Alert Routing Variants:** Integrate PagerDuty fallback for critical telemetry outages and marketing-specific Slack threads for adoption alerts.
