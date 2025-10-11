# Build Updates — Version 1.00

## 2025-10-11 — Issue Intake Automation & Tracker Regeneration
- Added `scripts/issue-intake.mjs`, a Node-based CLI that validates structured payloads inside `update_docs/1.00/pre-update_evaluations/issue_report.md` and regenerates `issue_list.md` + `fix_suggestions.md` with computed SLA deadlines, ownership metadata, and design references.
- Documented run instructions (`node scripts/issue-intake.mjs`) and embedded automation hook into the QA test plan so CI can block inconsistent issue payloads before merge.
- Seeded issue artefacts with four high/critical findings from backend and frontend evaluations, ensuring the build pipeline exposes blockers to programme dashboards without manual transcription.
