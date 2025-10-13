## 2025-10-29 — Persona Dashboard CSV Exports
- `/api/analytics/dashboards/:persona/export` streams persona-specific CSV payloads with metadata headers (persona, window start/end, timezone, generated timestamp) followed by flattened overview metrics, chart JSON snapshots, pipeline rows, compliance/fraud entries, and asset alerts in deterministic order.
- Export builder in `services/dashboardAnalyticsService.js` normalises decimals/currency, escapes commas/new lines, and formats timestamps in ISO-8601 to keep downstream finance, operations, and success tooling free from manual clean-up.
- CSV responses ship with `Content-Type: text/csv` and persona-based attachment filenames (`<persona>-analytics-YYYY-MM-DD.csv`) while controller validation/audit logging preserve traceability for scheduled jobs and BI ingestion.

## 2025-10-30 — Export Governance Validation
- Confirmed CSV builder trims datasets to configured `exportRowLimit`, preserves persona + timezone metadata, and escapes insight copy to avoid Excel injection during finance/ops ingest.【F:backend-nodejs/src/services/dashboardAnalyticsService.js†L611-L806】
- Downloaded staged exports for admin/provider personas to verify chart JSON snapshots, pipeline rows, and compliance tables match UI ordering; Looker ingestion harness consumed generated files without transformation tweaks.
- QA noted Vitest spinner noise during export regression run and raised tooling change to enforce CI reporters for future evidence capture.【3d3b31†L1-L38】
