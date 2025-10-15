# Controller Updates – Version 1.50

## 2025-03-28 – Compliance Data Requests Controller
- Extended `backend-nodejs/src/controllers/complianceController.js` with GDPR request submission, list, export, and status handlers wired to RBAC policies and audit logging.
- Added pagination-friendly list transforms, email normalisation, and defensive validation so the portal can safely handle enterprise-scale request volumes.
- Documented error surfaces and service orchestration to support both web and Flutter clients, including retention job hooks for export teardown.

## 2025-03-30 – Warehouse Export Controller Extension
- Added `getWarehouseExportRuns` and `createWarehouseExportRun` actions to `complianceController`, exposing dataset/region filtered CDC run listings and manual export triggers.
- Responses now return full `WarehouseExportRun` metadata including file paths and audit state to power React/Flutter operator consoles and compliance evidence logs.
- Controller delegates to the new warehouse export service while surfacing validation errors (unsupported dataset, active run conflicts) with meaningful HTTP statuses for portal clients.
