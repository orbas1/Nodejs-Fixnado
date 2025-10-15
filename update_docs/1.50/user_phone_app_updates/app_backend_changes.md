# Backend Integration Updates – User App

- Updated the authentication client to call `/api/auth/login`, `/api/auth/session/refresh`, and `/api/auth/logout` with mobile-specific metadata so the backend issues bearer tokens while also maintaining secure cookies for web flows.
- Persisted backend-issued session identifiers, access scopes, and expiries inside the new secure credential vault to support auditing and proactive refresh scheduling from the device.
- Documented the cookie + token interplay so QA can verify that mobile logins continue to function without cookies while browsers rely on httpOnly storage.
