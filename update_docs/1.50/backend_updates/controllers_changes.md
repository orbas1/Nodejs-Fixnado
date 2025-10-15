# Controller Updates – Version 1.50

## 2025-03-28 – Compliance Data Requests Controller
- Extended `backend-nodejs/src/controllers/complianceController.js` with GDPR request submission, list, export, and status handlers wired to RBAC policies and audit logging.
- Added pagination-friendly list transforms, email normalisation, and defensive validation so the portal can safely handle enterprise-scale request volumes.
- Documented error surfaces and service orchestration to support both web and Flutter clients, including retention job hooks for export teardown.
