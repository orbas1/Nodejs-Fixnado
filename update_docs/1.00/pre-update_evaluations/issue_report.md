# Issue Intake Report — Version 1.00

The issue intake artefact consolidates pre-update findings and live regression reports into a structured payload that powers the automated tracker (`scripts/issue-intake.mjs`). Each issue captures the operational context, SLA expectation, and remediation path so engineering, QA, design, and compliance squads can triage from a single source of truth.

## Intake Pipeline Overview
- Issues are appended to the JSON payload below and processed by running `node scripts/issue-intake.mjs` (or `./scripts/issue-intake.mjs`).
- The script validates field completeness, enforces severity naming, and computes SLA deadlines based on severity-specific policies.
- `issue_list.md` receives an aggregated table with SLA countdowns while `fix_suggestions.md` is regenerated with remediation guidance, acceptance criteria, and evidence links for each open defect.
- Metadata entries (version, notes, generatedBy, lastProcessedAt) provide auditability for programme reviews and compliance audits.

<!-- intake:start -->
```json
{
  "metadata": {
    "version": "1.0.0",
    "notes": "Initial ingestion of pre-update evaluation findings covering escrow funding, authentication hardening, registration transactions, and React form wiring gaps.",
    "generatedBy": "Task 1.4 Issue Intake Automation",
    "lastProcessedAt": "2025-10-11T06:02:34.836Z"
  },
  "issues": [
    {
      "id": "ISSUE-0001",
      "title": "Escrow orders mark as funded without payment verification",
      "severity": "critical",
      "status": "open",
      "reportedBy": "QA Lead",
      "reportedAt": "2025-10-11T05:30:00Z",
      "squad": "Backend – Marketplace & Payments",
      "owner": "Backend – Marketplace & Payments",
      "component": "backend-nodejs/src/controllers/serviceController.js",
      "environment": "staging",
      "description": "The purchaseService endpoint sets order.status to 'funded' and creates escrow rows immediately after a client request without verifying any payment gateway response or webhook callback.",
      "impact": "Financial loss and compliance risk — escrow balances can be recorded without confirmed funds, invalidating finance reconciliation, dispute workflows, and regulatory controls.",
      "reproduction": [
        "POST /api/services/:id/purchase with a valid JWT while the payment gateway sandbox is unavailable or credentials are invalid.",
        "Observe the API response: order.status returns 'funded' and escrow payload contains status 'funded'.",
        "Inspect the database to confirm no external payment reference or verification timestamp is stored."
      ],
      "recommendedFix": [
        "Integrate payment intent creation and asynchronous webhook verification before transitioning orders/escrows to funded.",
        "Introduce an intermediate payment_pending status and prevent downstream workflows until the webhook handshake succeeds.",
        "Emit structured audit logs and metrics for pending/failed payment verifications so finance can reconcile exceptions.",
        "Add Vitest contract + chaos scenarios to ensure failed webhooks leave orders in payment_pending with compensating alerts."
      ],
      "acceptanceCriteria": [
        "Orders remain payment_pending until a verified payment_reference is persisted from the gateway webhook.",
        "Escrow creation is idempotent and tied to the verified payment_reference (duplicate webhook attempts do not create duplicates).",
        "Integration tests simulate gateway failure and assert that order/escrow status stays payment_pending with an alert raised.",
        "Finance Slack channel receives notification when payment_pending exceeds SLA thresholds (configurable)."
      ],
      "dependencies": [
        "Requires secure storage of gateway credentials via infrastructure secrets manager (Terraform secrets entry).",
        "Coordinate with finance and compliance stakeholders to align ledger expectations and dispute resolution rules."
      ],
      "evidence": [
        {
          "type": "code-reference",
          "value": "backend-nodejs/src/controllers/serviceController.js",
          "details": "purchaseService marks orders and escrows as funded immediately after create without any external verification."
        },
        {
          "type": "evaluation-note",
          "value": "update_docs/1.00/pre-update_evaluations/backend_evaluation.md",
          "details": "Integration section documents absence of payment gateway handshake."
        }
      ]
    },
    {
      "id": "ISSUE-0002",
      "title": "Authentication lacks rate limiting and ships with default secrets",
      "severity": "high",
      "status": "open",
      "reportedBy": "Security Analyst",
      "reportedAt": "2025-10-11T05:45:00Z",
      "squad": "Backend – Platform Security",
      "owner": "Backend – Platform Security",
      "component": "backend-nodejs/src/middleware/auth.js",
      "environment": "staging",
      "description": "Login endpoints accept unlimited attempts and the API boots with placeholder JWT secrets when environment variables are missing, enabling brute-force attacks and invalidating security posture documentation.",
      "impact": "Security and compliance breach — unauthorised actors can brute-force credentials, auditors will reject environments that ship with default secrets, and incident response lacks telemetry for lockouts.",
      "reproduction": [
        "Inspect backend-nodejs/src/config/index.js to confirm JWT secret fallback of 'your_jwt_secret'.",
        "Send >100 POST /api/auth/login requests with random credentials; responses continue returning 401 without any throttling headers.",
        "Review logs to confirm absence of lockout or rate limit telemetry."
      ],
      "recommendedFix": [
        "Introduce request throttling (e.g., express-rate-limit or Redis backed limiter) with severity-aware thresholds per IP and account.",
        "Fail startup when JWT_SECRET or REFRESH_TOKEN_SECRET use default values and document secret rotation policy.",
        "Persist lockout counters and emit security telemetry/audit logs for monitoring and compliance evidence.",
        "Add unit/integration tests asserting 429 responses after configured attempts and verifying startup guard rails."
      ],
      "acceptanceCriteria": [
        "Login and password reset endpoints return 429 after configured thresholds and include Retry-After headers.",
        "Server boot fails with explicit error if JWT secret env vars are absent or match known placeholders.",
        "Security telemetry topic receives lockout events with masked identifiers and timestamp.",
        "Documentation/runbook updated with rotation cadence and emergency secret rotation steps."
      ],
      "dependencies": [
        "Requires secrets manager integration updates delivered in infrastructure Terraform.",
        "Coordinate with frontend and Flutter teams to surface lockout messaging and cooldown timers."
      ],
      "evidence": [
        {
          "type": "code-reference",
          "value": "backend-nodejs/src/config/index.js",
          "details": "Exports JWT secret fallback 'your_jwt_secret' when env var missing."
        },
        {
          "type": "code-reference",
          "value": "backend-nodejs/src/middleware/auth.js",
          "details": "Authentication middleware performs no throttling or lockout checks."
        },
        {
          "type": "evaluation-note",
          "value": "update_docs/1.00/pre-update_evaluations/backend_evaluation.md",
          "details": "Security section highlights missing rate limiting and weak secret controls."
        }
      ]
    },
    {
      "id": "ISSUE-0003",
      "title": "Registration flow can leave orphaned company/user records",
      "severity": "high",
      "status": "open",
      "reportedBy": "QA Lead",
      "reportedAt": "2025-10-11T05:55:00Z",
      "squad": "Backend – Identity & Compliance",
      "owner": "Backend – Identity & Compliance",
      "component": "backend-nodejs/src/controllers/authController.js",
      "environment": "staging",
      "description": "User registration creates a User row then conditionally inserts a Company without wrapping operations in a transaction; failures after the user insert leave inconsistent data that breaks onboarding.",
      "impact": "Data integrity issue — orphaned users or companies block onboarding, pollute analytics, and require manual cleanup violating compliance data minimisation policies.",
      "reproduction": [
        "Trigger POST /api/auth/register with company payload while forcing a database error on company creation (e.g., duplicate tax ID).",
        "Observe response 500 while the user row exists without associated company record.",
        "Subsequent login attempts fail due to missing company linkage."
      ],
      "recommendedFix": [
        "Wrap user + company creation in a Sequelize transaction to guarantee atomicity and rollback on failure.",
        "Add compensating logic to delete partially created users if downstream onboarding fails prior to verification.",
        "Record onboarding audit events for success/failure to aid compliance evidence.",
        "Expand Vitest coverage to simulate transaction rollback and assert database state cleanup."
      ],
      "acceptanceCriteria": [
        "User and company creation succeed or rollback together leaving no orphan records.",
        "Audit log captures onboarding success/failure with correlation IDs.",
        "Automated tests cover rollback path and confirm zero orphan records after forced failure.",
        "Support runbook updated with steps to replay failed registrations after fix."
      ],
      "dependencies": [
        "Coordinate with analytics team to handle retroactive cleanup of affected records.",
        "Update support tooling to surface any legacy orphaned accounts for remediation."
      ],
      "evidence": [
        {
          "type": "code-reference",
          "value": "backend-nodejs/src/controllers/authController.js",
          "details": "register function performs sequential creates with no transaction guard."
        },
        {
          "type": "evaluation-note",
          "value": "update_docs/1.00/pre-update_evaluations/backend_evaluation.md",
          "details": "Errors section calls out orphan records risk."
        }
      ]
    },
    {
      "id": "ISSUE-0004",
      "title": "React auth forms do not submit to backend APIs",
      "severity": "critical",
      "status": "open",
      "reportedBy": "Frontend QA",
      "reportedAt": "2025-10-11T06:05:00Z",
      "squad": "Web – Account Experience",
      "owner": "Web – Account Experience",
      "component": "frontend-reactjs/src/pages/Login.jsx",
      "environment": "staging",
      "description": "Login and registration pages render form fields but lack onSubmit handlers or API orchestration, preventing any user from authenticating or completing onboarding flows.",
      "impact": "Critical functional blocker — users cannot sign in or register, halting pilot onboarding, QA scripts, and automated smoke tests. Marketing claims around MFA/escrow are untestable without authentication.",
      "reproduction": [
        "Navigate to /login in the staging build.",
        "Fill email/password and submit; form triggers default browser submission with no network request to backend.",
        "Check devtools network tab to confirm absence of POST /api/auth/login and observe UI provides no error/loading state.",
        "Repeat on /register and observe identical behaviour."
      ],
      "recommendedFix": [
        "Wire login/register forms to the authentication API using a hardened API client with error handling and CSRF-safe token storage strategy.",
        "Add form state management (loading, error, validation messages) and instrumentation for analytics + telemetry.",
        "Introduce route guards to redirect authenticated users away from auth screens and protect admin routes.",
        "Author React Testing Library + Playwright specs covering happy/error paths and verifying telemetry events fire."
      ],
      "acceptanceCriteria": [
        "Submitting login/register triggers API calls, surfaces validation errors, and persists tokens securely (httpOnly cookie or secure storage abstraction).",
        "Admin and dashboard routes enforce authenticated access, redirecting anonymous visitors to login.",
        "Automated tests cover success + failure flows and capture telemetry instrumentation for authentication journey.",
        "UX copy and loading states align with design specifications (`Application_Design_Update` auth screens)."
      ],
      "dependencies": [
        "Requires backend authentication improvements (rate limiting, lockout messaging) to align UI feedback.",
        "Coordinate with design ops to validate copy and loading state behaviours."
      ],
      "evidence": [
        {
          "type": "code-reference",
          "value": "frontend-reactjs/src/pages/Login.jsx",
          "details": "Form lacks onSubmit handler and never invokes API client."
        },
        {
          "type": "code-reference",
          "value": "frontend-reactjs/src/pages/Register.jsx",
          "details": "Registration form contains no submission logic and no validation messaging."
        },
        {
          "type": "evaluation-note",
          "value": "update_docs/1.00/pre-update_evaluations/front_end_evaluation.md",
          "details": "Functionality section documents missing form submission logic."
        }
      ]
    }
  ]
}
```
<!-- intake:end -->

## Field Reference
- **id** — Stable tracker identifier used across automation, dashboards, and release notes.
- **severity** — One of `critical`, `high`, `medium`, `low`; maps to SLA in `scripts/issue-intake.mjs`.
- **status** — Workflow state (`open`, `in-progress`, `resolved`, etc.); status transitions are reflected downstream when the script runs.
- **reportedBy / squad / owner** — Provides accountability across squads, enabling automated Slack alerts and RACI auditing.
- **reproduction / evidence** — Structured steps and links to code or documentation, ensuring QA and developers can reproduce without additional clarification.
- **recommendedFix / acceptanceCriteria** — Capture remediation intent and Definition of Done to prevent partial fixes entering production.

## Operating Notes
- Update this file when new defects are confirmed through QA, design audits, compliance reviews, or stakeholder feedback.
- After editing, run the automation script and commit the regenerated `issue_list.md` and `fix_suggestions.md` files so progress trackers stay in sync.
- Severity escalations should be reviewed during daily triage; SLA breaches trigger Slack notifications via the governance workflow described in `update_docs/1.00/update_plan.md`.
