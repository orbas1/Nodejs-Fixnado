### `20250306000000-encrypt-user-company-pii.js`
- Adds encrypted columns for user names, email, and address plus hashed lookup indices; applies the same pattern to company contact details.
- Runs inside a transaction, encrypting existing rows with the active PII keys before removing plaintext fields to avoid downtime.
- Down migration restores legacy columns by decrypting values, supporting rollback rehearsals documented in the compliance plan.

### `20250320000000-compliance-data-governance.js`
- Creates `regions`, `data_subject_requests`, `finance_transaction_histories`, `message_histories`, and `storefront_revision_logs` tables with appropriate foreign keys and indexes.
- Augments existing domain tables (users, orders, escrows, disputes, rentals, conversations, companies, storefronts) to include `region_id` references and default GB assignments for legacy records.
- Seeds baseline regions (GB, IE, AE) and ensures down migration removes indexes, drops tables, and cleans up enum types without leaving residues.
