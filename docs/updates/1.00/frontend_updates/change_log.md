# Front-end Change Log

## Error reporting upgrades (Version 1.00)
- Expanded the React telemetry reporter to attach release metadata, correlation identifiers, sanitised breadcrumbs, and session context before posting to `/v1/telemetry/client-errors`, while enforcing payload limits that mirror backend validators.【F:frontend-reactjs/src/utils/errorReporting.js†L1-L278】
