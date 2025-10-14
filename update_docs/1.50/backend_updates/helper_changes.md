## Security Utilities

- Added `src/utils/security/fieldEncryption.js` providing centralised AES-256-GCM encryption, SHA-512/HMAC hashing, email normalisation, and safe redaction helpers for models, migrations, and future services.
- Introduced `src/config/secretLoader.js` to wrap AWS Secrets Manager lookups with in-memory caching and JSON extraction helpers, enabling runtime services to hydrate secrets without embedding cloud SDK logic.
