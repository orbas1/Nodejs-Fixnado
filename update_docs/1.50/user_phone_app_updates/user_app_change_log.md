# User Phone App Change Log – Version 1.50

## 2025-03-17 – Secure Session Vault & Biometric Unlock
- Added hardened credential storage using `flutter_secure_storage` with platform-specific encryption defaults to hold access/refresh tokens offline.
- Introduced a Riverpod-driven session controller that hydrates credentials from secure storage, enforces biometric unlock before exposing tokens, and clears state on logout.
- Delivered an `AuthSessionApi` capable of login, refresh, and logout orchestration against the backend `/api/auth` endpoints to support production authentication flows.
