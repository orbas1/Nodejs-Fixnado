# Test Plan Notes

## 2024-05-20 – Data Foundations
- Added unit coverage (`marketplaceTaxonomySeed.test.js`) validating taxonomy blueprint integrity and checksum metadata.
- Scheduled nightly execution of `scripts/taxonomy-integrity.mjs` to assert deployed data matches deterministic seed plan before timeline hub work commences.

## 2024-05-30 – Compliance & Launch Readiness
- Extended `legalDocumentService.test.js` to cover acknowledgement metadata, audience normalisation, and health calculations on published legal documents.
- Executed Vitest suite plus targeted smoke tests (Chatwoot session bootstrap, DSAR export, refund workflow) during go-live rehearsal; artefacts stored in release vault `ci/2024-05-30/`.
- Validated DSAR metrics endpoint via `tests/complianceMetricsRoutes.test.js` using rehearsal data to confirm overdue and percentile calculations.
