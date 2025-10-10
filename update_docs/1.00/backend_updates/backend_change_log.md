# Version 1.00 – Backend Change Log

## 2025-10-10 – Authentication Hardening
- Wrapped user and company onboarding in a Sequelize transaction to guarantee atomic account creation and provide deterministic rollback on failure.
- Added sanitised response serializers for login and profile endpoints to remove password hashes while surfacing two-factor metadata required by clients.
- Centralised validation error formatting to deliver consistent 422 payloads across registration and login flows.
