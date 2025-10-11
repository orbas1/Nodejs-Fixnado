# Fix Suggestions — Version 1.00
_Generated: 2025-10-11 06:02:34.836 UTC_

## ISSUE-0001 — Escrow orders mark as funded without payment verification
- **Severity:** Critical (24h SLA)
- **Status:** open — Reported 2025-10-11 (32m ago); SLA due 2025-10-12 05:30:00.000 UTC
- **Squad / Owner:** Backend – Marketplace & Payments
- **Environment:** staging
- **Impact:** Financial loss and compliance risk — escrow balances can be recorded without confirmed funds, invalidating finance reconciliation, dispute workflows, and regulatory controls.
- **Problem Statement:** The purchaseService endpoint sets order.status to 'funded' and creates escrow rows immediately after a client request without verifying any payment gateway response or webhook callback.

### Reproduction Steps
1. POST /api/services/:id/purchase with a valid JWT while the payment gateway sandbox is unavailable or credentials are invalid.
2. Observe the API response: order.status returns 'funded' and escrow payload contains status 'funded'.
3. Inspect the database to confirm no external payment reference or verification timestamp is stored.

### Recommended Remediation Actions
- Integrate payment intent creation and asynchronous webhook verification before transitioning orders/escrows to funded.
- Introduce an intermediate payment_pending status and prevent downstream workflows until the webhook handshake succeeds.
- Emit structured audit logs and metrics for pending/failed payment verifications so finance can reconcile exceptions.
- Add Vitest contract + chaos scenarios to ensure failed webhooks leave orders in payment_pending with compensating alerts.

### Acceptance Criteria
- [ ] Orders remain payment_pending until a verified payment_reference is persisted from the gateway webhook.
- [ ] Escrow creation is idempotent and tied to the verified payment_reference (duplicate webhook attempts do not create duplicates).
- [ ] Integration tests simulate gateway failure and assert that order/escrow status stays payment_pending with an alert raised.
- [ ] Finance Slack channel receives notification when payment_pending exceeds SLA thresholds (configurable).

### Dependencies & Notes
- Requires secure storage of gateway credentials via infrastructure secrets manager (Terraform secrets entry).
- Coordinate with finance and compliance stakeholders to align ledger expectations and dispute resolution rules.

### Evidence
- **code-reference:** backend-nodejs/src/controllers/serviceController.js — purchaseService marks orders and escrows as funded immediately after create without any external verification.
- **evaluation-note:** update_docs/1.00/pre-update_evaluations/backend_evaluation.md — Integration section documents absence of payment gateway handshake.

## ISSUE-0004 — React auth forms do not submit to backend APIs
- **Severity:** Critical (24h SLA)
- **Status:** open — Reported 2025-10-11 (0m ago); SLA due 2025-10-12 06:05:00.000 UTC
- **Squad / Owner:** Web – Account Experience
- **Environment:** staging
- **Impact:** Critical functional blocker — users cannot sign in or register, halting pilot onboarding, QA scripts, and automated smoke tests. Marketing claims around MFA/escrow are untestable without authentication.
- **Problem Statement:** Login and registration pages render form fields but lack onSubmit handlers or API orchestration, preventing any user from authenticating or completing onboarding flows.

### Reproduction Steps
1. Navigate to /login in the staging build.
2. Fill email/password and submit; form triggers default browser submission with no network request to backend.
3. Check devtools network tab to confirm absence of POST /api/auth/login and observe UI provides no error/loading state.
4. Repeat on /register and observe identical behaviour.

### Recommended Remediation Actions
- Wire login/register forms to the authentication API using a hardened API client with error handling and CSRF-safe token storage strategy.
- Add form state management (loading, error, validation messages) and instrumentation for analytics + telemetry.
- Introduce route guards to redirect authenticated users away from auth screens and protect admin routes.
- Author React Testing Library + Playwright specs covering happy/error paths and verifying telemetry events fire.

### Acceptance Criteria
- [ ] Submitting login/register triggers API calls, surfaces validation errors, and persists tokens securely (httpOnly cookie or secure storage abstraction).
- [ ] Admin and dashboard routes enforce authenticated access, redirecting anonymous visitors to login.
- [ ] Automated tests cover success + failure flows and capture telemetry instrumentation for authentication journey.
- [ ] UX copy and loading states align with design specifications (`Application_Design_Update` auth screens).

### Dependencies & Notes
- Requires backend authentication improvements (rate limiting, lockout messaging) to align UI feedback.
- Coordinate with design ops to validate copy and loading state behaviours.

### Evidence
- **code-reference:** frontend-reactjs/src/pages/Login.jsx — Form lacks onSubmit handler and never invokes API client.
- **code-reference:** frontend-reactjs/src/pages/Register.jsx — Registration form contains no submission logic and no validation messaging.
- **evaluation-note:** update_docs/1.00/pre-update_evaluations/front_end_evaluation.md — Functionality section documents missing form submission logic.

## ISSUE-0002 — Authentication lacks rate limiting and ships with default secrets
- **Severity:** High (48h SLA)
- **Status:** open — Reported 2025-10-11 (17m ago); SLA due 2025-10-13 05:45:00.000 UTC
- **Squad / Owner:** Backend – Platform Security
- **Environment:** staging
- **Impact:** Security and compliance breach — unauthorised actors can brute-force credentials, auditors will reject environments that ship with default secrets, and incident response lacks telemetry for lockouts.
- **Problem Statement:** Login endpoints accept unlimited attempts and the API boots with placeholder JWT secrets when environment variables are missing, enabling brute-force attacks and invalidating security posture documentation.

### Reproduction Steps
1. Inspect backend-nodejs/src/config/index.js to confirm JWT secret fallback of 'your_jwt_secret'.
2. Send >100 POST /api/auth/login requests with random credentials; responses continue returning 401 without any throttling headers.
3. Review logs to confirm absence of lockout or rate limit telemetry.

### Recommended Remediation Actions
- Introduce request throttling (e.g., express-rate-limit or Redis backed limiter) with severity-aware thresholds per IP and account.
- Fail startup when JWT_SECRET or REFRESH_TOKEN_SECRET use default values and document secret rotation policy.
- Persist lockout counters and emit security telemetry/audit logs for monitoring and compliance evidence.
- Add unit/integration tests asserting 429 responses after configured attempts and verifying startup guard rails.

### Acceptance Criteria
- [ ] Login and password reset endpoints return 429 after configured thresholds and include Retry-After headers.
- [ ] Server boot fails with explicit error if JWT secret env vars are absent or match known placeholders.
- [ ] Security telemetry topic receives lockout events with masked identifiers and timestamp.
- [ ] Documentation/runbook updated with rotation cadence and emergency secret rotation steps.

### Dependencies & Notes
- Requires secrets manager integration updates delivered in infrastructure Terraform.
- Coordinate with frontend and Flutter teams to surface lockout messaging and cooldown timers.

### Evidence
- **code-reference:** backend-nodejs/src/config/index.js — Exports JWT secret fallback 'your_jwt_secret' when env var missing.
- **code-reference:** backend-nodejs/src/middleware/auth.js — Authentication middleware performs no throttling or lockout checks.
- **evaluation-note:** update_docs/1.00/pre-update_evaluations/backend_evaluation.md — Security section highlights missing rate limiting and weak secret controls.

## ISSUE-0003 — Registration flow can leave orphaned company/user records
- **Severity:** High (48h SLA)
- **Status:** open — Reported 2025-10-11 (7m ago); SLA due 2025-10-13 05:55:00.000 UTC
- **Squad / Owner:** Backend – Identity & Compliance
- **Environment:** staging
- **Impact:** Data integrity issue — orphaned users or companies block onboarding, pollute analytics, and require manual cleanup violating compliance data minimisation policies.
- **Problem Statement:** User registration creates a User row then conditionally inserts a Company without wrapping operations in a transaction; failures after the user insert leave inconsistent data that breaks onboarding.

### Reproduction Steps
1. Trigger POST /api/auth/register with company payload while forcing a database error on company creation (e.g., duplicate tax ID).
2. Observe response 500 while the user row exists without associated company record.
3. Subsequent login attempts fail due to missing company linkage.

### Recommended Remediation Actions
- Wrap user + company creation in a Sequelize transaction to guarantee atomicity and rollback on failure.
- Add compensating logic to delete partially created users if downstream onboarding fails prior to verification.
- Record onboarding audit events for success/failure to aid compliance evidence.
- Expand Vitest coverage to simulate transaction rollback and assert database state cleanup.

### Acceptance Criteria
- [ ] User and company creation succeed or rollback together leaving no orphan records.
- [ ] Audit log captures onboarding success/failure with correlation IDs.
- [ ] Automated tests cover rollback path and confirm zero orphan records after forced failure.
- [ ] Support runbook updated with steps to replay failed registrations after fix.

### Dependencies & Notes
- Coordinate with analytics team to handle retroactive cleanup of affected records.
- Update support tooling to surface any legacy orphaned accounts for remediation.

### Evidence
- **code-reference:** backend-nodejs/src/controllers/authController.js — register function performs sequential creates with no transaction guard.
- **evaluation-note:** update_docs/1.00/pre-update_evaluations/backend_evaluation.md — Errors section calls out orphan records risk.

> Generated via `scripts/issue-intake.mjs`. Update `issue_report.md` and re-run the script to refresh.

