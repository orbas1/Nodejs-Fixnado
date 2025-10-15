# Policy & RBAC Updates – Version 1.50

## 2025-03-28 – Compliance Permissions Expansion
- Extended `backend-nodejs/src/policies/routePolicies.js` with `compliance.manageRequests` guarding the new GDPR endpoints.
- Mapped the permission into provider, enterprise, operations, and admin roles per the hardened RBAC matrix while keeping customer/serviceman access denied by default.
- Documented policy descriptions for audit exports so telemetry and portal surfaces can explain why access is granted or denied.

## 2025-03-30 – Warehouse Export & Credential Rotation Policies
- Added `compliance.manageWarehouseExports` and `infrastructure.rotateDatabaseCredentials` scopes to the permissions catalogue with explicit descriptions for audit messaging and operator tooling.
- Updated `backend-nodejs/src/constants/rbacMatrix.js` so only operations, compliance, and platform security cohorts inherit warehouse export controls, while credential rotation remains restricted to platform security administrators.
- Expanded `routePolicies.compliance` with dedicated guards for `/api/compliance/data-warehouse/runs` list/create routes and wired the rotation guard into background job registration, ensuring policy checks cover manual triggers and automated schedulers alike.
