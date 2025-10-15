# Export & Data Delivery Updates – Version 1.50

## 2025-03-30 – Warehouse CDC Export Bundles
- Provisioned `dataWarehouseExportService` to stream orders, finance ledger events, and communications history into dataset-specific NDJSON files which are compressed into `.gz` bundles per run for efficient downstream ingestion.
- Each export run is written beneath `storage/warehouse-exports/<REGION>/<DATASET>/` with deterministic naming (`<dataset>_<region>_<timestamp>.ndjson.gz`) and run metadata recorded inside `warehouse_export_runs` to support cataloguing and replay.
- Compression is handled via Node’s `pipeline` and `createGzip` utilities to avoid memory pressure during large exports while retaining backpressure support for millions of records.
- Export jobs attach record counts, duration, and SHA-256 checksums to the run metadata so data engineering teams can validate integrity before transferring files into the analytics warehouse.

## 2025-03-30 – GDPR Request Export Hardening
- Extended the GDPR export pathway inside `dataGovernanceService` to leverage the shared storage helper ensuring parity between data subject exports and warehouse bundles.
- Added dataset-specific serializers (orders, finance, message history) that strip sensitive tokens, internal identifiers, and hashed secrets while preserving IDs and timestamps needed for compliance disclosures.
- Updated retention automation to respect dataset retention windows and to delete both the export files and run metadata once the retention threshold is reached, reducing long-term storage risk.
