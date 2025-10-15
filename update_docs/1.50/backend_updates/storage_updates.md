## PII Column Hardening

- Replaced plaintext `User` columns (`first_name`, `last_name`, `email`, `address`) with encrypted counterparts and added `email_hash` index for deterministic queries.
- Encrypted `Company` contact metadata and introduced hashed fingerprints to support opt-in communications while respecting provider privacy.
- Migration executes within a single transaction, ensuring no partially encrypted data persists if the process aborts.

## Compliance Export Storage
- Introduced `storage/data-exports/<region>` directory hierarchy managed by `dataGovernanceService` to persist GDPR export payloads.
- Exports store sanitised JSON snapshots of orders, conversations, rentals, disputes, and companies tied to a request, including metadata for audit replay.
- Retention job periodically removes aged exports based on `dataGovernance.accessLogRetentionDays`, ensuring on-disk footprint aligns with compliance policy.
