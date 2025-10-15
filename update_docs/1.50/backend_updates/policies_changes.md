# Policy & RBAC Updates – Version 1.50

## 2025-03-28 – Compliance Permissions Expansion
- Extended `backend-nodejs/src/policies/routePolicies.js` with `compliance.manageRequests` guarding the new GDPR endpoints.
- Mapped the permission into provider, enterprise, operations, and admin roles per the hardened RBAC matrix while keeping customer/serviceman access denied by default.
- Documented policy descriptions for audit exports so telemetry and portal surfaces can explain why access is granted or denied.
