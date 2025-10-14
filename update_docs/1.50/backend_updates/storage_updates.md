## PII Column Hardening

- Replaced plaintext `User` columns (`first_name`, `last_name`, `email`, `address`) with encrypted counterparts and added `email_hash` index for deterministic queries.
- Encrypted `Company` contact metadata and introduced hashed fingerprints to support opt-in communications while respecting provider privacy.
- Migration executes within a single transaction, ensuring no partially encrypted data persists if the process aborts.
