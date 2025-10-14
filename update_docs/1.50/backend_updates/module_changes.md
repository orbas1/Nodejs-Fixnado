## Model Updates

- **User model** now stores `firstName`, `lastName`, `email`, and `address` as AES-256-GCM encrypted blobs with deterministic `emailHash` lookups. Custom setters/getters transparently encrypt/decrypt values, and a `beforeFind` hook rewrites email queries into hash comparisons to preserve ergonomics without exposing plaintext.
- **Company model** encrypts `contactName`/`contactEmail` and tracks hashed contact email fingerprints to align provider communications with the new privacy baseline.
- Both models override `toJSON()` to strip hash metadata before serialisation, preventing leakage through API responses or logs.

### New Security-Oriented Models
- **SessionToken** captures hashed refresh tokens, rotation metadata, and client fingerprinting (IP, user-agent) to support cookie-based auth and revocation workflows.
- **SecurityAuditEvent** records privileged actions with actor role, status, and metadata payloads for compliance reporting.
- **ConsentEvent** persists consent receipts (type, version, granted flag) with session identifiers so web and mobile clients can surface audit trails.
- **ScamDetectionEvent** stores heuristic scoring outputs for live feed posts, bids, and messages, enabling downstream review and analytics.
