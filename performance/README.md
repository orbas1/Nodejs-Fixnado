# Performance & Resilience Harness

The `performance` suite delivers production-grade load, resilience, and analytics drills covering booking orchestration, real-time communications, escrow purchases, persona analytics, and campaign telemetry. It satisfies Task 6.3 requirements by providing an automated k6 harness, reusable load profiles, and CI-friendly orchestration.

## Prerequisites
- Running Fixnado stack with seeded data for the target environment.
- [k6](https://k6.io/docs/get-started/installation/) CLI available on the path (v0.46+).
- Valid JWT tokens for the following personas:
  - `K6_USER_TOKEN` — consumer/user account able to purchase services.
  - `K6_PROVIDER_TOKEN` — provider/serviceman account able to publish services and accept bookings.
  - `K6_ADMIN_TOKEN` — admin/company operator for analytics and campaign APIs.
- Entity identifiers aligned to seeded data:
  - `K6_COMPANY_ID`, `K6_PROVIDER_ID`, `K6_CUSTOMER_ID`.
  - Optional overrides: `K6_ZONE_ID`, `K6_SERVICE_ID`, `K6_CAMPAIGN_ID`, `K6_DISPATCHER_ID`, `K6_ANALYTICS_PERSONA`.

## Profile Structure
`profiles/baseline.json` encodes the default concurrency envelope:
- Ramping arrival tests for bookings, chat, and campaign telemetry.
- Constant arrival escrow purchases.
- Constant VU analytics polling for dashboard & pipeline health.
- Scenario-specific thresholds for response time and success rates.
- Shared settings (sleep cadence, booking demand mix, analytics window) consumed by the k6 script.

Profiles can be cloned and tuned for staging vs. production rehearsals. All required environment keys are listed in `requiredEnv` and validated before execution.

## Script Overview
`k6/main.js` orchestrates five scenarios:
1. **booking_flow** — Creates bookings, assigns providers, records acceptance, and completes the job to measure SLA latency.
2. **chat_flow** — Opens conversations, exchanges customer/provider messages, and provisions Agora sessions to verify quiet-hour governance.
3. **payments_flow** — Executes escrow purchases against synthetic services to stress order + escrow transactions.
4. **analytics_flow** — Fetches persona dashboards and pipeline status to monitor aggregation latency under load.
5. **ads_flow** — Ingests campaign metrics, reads summaries, and resolves fraud signals to exercise monetisation telemetry.

Each scenario publishes bespoke success rates and duration trends with thresholds captured in the profile. Failures are logged with actionable error messages so ops can triage regression points quickly.

## Execution
Run the orchestrator from the repository root:
```bash
npm --prefix backend-nodejs run load:test \
  -- --profile performance/profiles/baseline.json \
  --summary performance/reports/baseline-summary.json
```

The wrapper script (`scripts/run-load-tests.mjs`) validates required environment variables, ensures a k6 binary is present, and forwards summary exports to `performance/reports/`. Additional flags after `--` are passed directly to k6 (e.g., `--vus`, `--duration`, or `--tag`).

### Environment Variables
Example configuration for a staging drill:
```bash
export K6_BASE_URL="https://staging.fixnado.internal"
export K6_COMPANY_ID="ae1de730-5ae3-4a3b-9d03-7b7931c948c5"
export K6_PROVIDER_ID="c3cf9ce9-45a7-4b2c-9b12-4c0d2d0cc413"
export K6_CUSTOMER_ID="db472b50-3f4e-4a01-8224-07c3c4a42145"
export K6_USER_TOKEN="<user jwt>"
export K6_PROVIDER_TOKEN="<provider jwt>"
export K6_ADMIN_TOKEN="<admin jwt>"
```
Optional overrides (`K6_ZONE_ID`, `K6_SERVICE_ID`, `K6_CAMPAIGN_ID`) allow reuse of pre-existing fixtures; otherwise, the harness will provision synthetic resources automatically and reuse them across iterations.

### Scaling
Use `K6_LOAD_MULTIPLIER` to scale the baseline profile without editing JSON:
```bash
K6_LOAD_MULTIPLIER=1.5 npm --prefix backend-nodejs run load:test
```
This multiplies stage targets, VUs, and arrival rates by 1.5 while keeping thresholds intact.

## Outputs
- **Console** — Real-time scenario metrics with error logging per failure.
- **Summary JSON** — Deterministic export ready for CI artefacts, dashboards, or historical comparisons.
- **Metrics** — Custom trends (`*_duration`) and rates (`*_success_rate`) feeding thresholds and Prometheus-compatible scraping when executed via the k6 operator.

## Extending
- Duplicate `profiles/baseline.json` to create peak-load or soak variants.
- Adjust scenario settings (e.g., booking lead windows, analytics timezone) to mirror regional drills.
- Integrate with CI by adding a GitHub Actions job that installs k6 and invokes `npm --prefix backend-nodejs run load:test` on demand.

Refer to `update_docs/1.00/test_plan.md` for governance on when to execute the harness (pre-release load rehearsal, quiet-hour anomaly drill, campaign telemetry regression) and acceptance criteria for Task 6.3.
