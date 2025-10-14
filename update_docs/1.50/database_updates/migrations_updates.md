### `20250306000000-encrypt-user-company-pii.js`
- Adds encrypted columns for user names, email, and address plus hashed lookup indices; applies the same pattern to company contact details.
- Runs inside a transaction, encrypting existing rows with the active PII keys before removing plaintext fields to avoid downtime.
- Down migration restores legacy columns by decrypting values, supporting rollback rehearsals documented in the compliance plan.
