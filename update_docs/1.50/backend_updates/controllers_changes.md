## Auth Controller Enhancements

- `login` and `refresh` now await the vault-backed signing helper before issuing access tokens, ensuring JWT secrets are sourced exclusively from AWS Secrets Manager (or validated environment variables) without leaking config internals.
- Admin logins validate the break-glass security token via the vault service while preserving existing email/domain allowlists, delivering consistent audit logging for both successful and rejected attempts.
- Session cookie issuance remains unchanged for consumers but now benefits from cached signing keys, reducing per-request overhead and aligning with the rotated session token identifiers returned by `sessionTokenService`.
