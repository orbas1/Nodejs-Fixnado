## Model Updates

- **User model** now stores `firstName`, `lastName`, `email`, and `address` as AES-256-GCM encrypted blobs with deterministic `emailHash` lookups. Custom setters/getters transparently encrypt/decrypt values, and a `beforeFind` hook rewrites email queries into hash comparisons to preserve ergonomics without exposing plaintext.
- **Company model** encrypts `contactName`/`contactEmail` and tracks hashed contact email fingerprints to align provider communications with the new privacy baseline.
- Both models override `toJSON()` to strip hash metadata before serialisation, preventing leakage through API responses or logs.
