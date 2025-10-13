# Backend Load & Performance Drill Script — 2025-11-03

```bash
# 1. Ensure k6 is installed locally or in CI runner
k6 version

# 2. Export required tokens/identifiers (example staging values shown)
export K6_BASE_URL="https://staging.fixnado.internal"
export K6_COMPANY_ID="<company uuid>"
export K6_PROVIDER_ID="<provider uuid>"
export K6_CUSTOMER_ID="<customer uuid>"
export K6_USER_TOKEN="<user jwt>"
export K6_PROVIDER_TOKEN="<provider jwt>"
export K6_ADMIN_TOKEN="<admin jwt>"

# Optional overrides (defaults generated automatically)
# export K6_ZONE_ID="<zone uuid>"
# export K6_SERVICE_ID="<service uuid>"
# export K6_CAMPAIGN_ID="<campaign uuid>"

# 3. Execute baseline drill with governed profile + summary export
npm --prefix backend-nodejs run load:test \
  -- --profile performance/profiles/baseline.json \
         --summary performance/reports/baseline-summary.json

# 4. Capture JSON summary for evidence + regression dashboards
cat performance/reports/baseline-summary.json

# 5. (Optional) Scale workload for soak / chaos rehearsals
# K6_LOAD_MULTIPLIER=1.5 npm --prefix backend-nodejs run load:test -- --profile performance/profiles/baseline.json
```

*Notes*
- `scripts/run-load-tests.mjs` will exit early if any required environment variables are missing or if the k6 binary is unavailable.
- Summary exports should be attached to QA evidence and compared against thresholds defined inside `performance/profiles/baseline.json`.
