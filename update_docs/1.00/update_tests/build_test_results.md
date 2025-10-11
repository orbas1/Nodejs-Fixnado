# Build Test Results — 2025-10-14

| Stack | Command | Result | Coverage Snapshot | Notes |
| --- | --- | --- | --- | --- |
| Backend (Node.js) | `npm test` | ✅ | Statements 79.58%, Functions 85.41%, Branches 48.48%, Lines 79.58% | Vitest thresholds now enforced via `vitest.config.js` scoped to booking/finance/toggle/zone services plus routes/middleware. |
| Frontend (React) | `npm test` | ✅ | Statements 85.32%, Functions 91.66%, Branches 55.26%, Lines 85.32% | Coverage limited to ThemeProvider, telemetry utils, and theme tokens per new CI gates. |
| Flutter | `flutter test --coverage` | ⚠️ | _CI workflow executes; local CLI unavailable in container_ | GitHub Actions job provisions Flutter toolchain, runs `flutter analyze`, `flutter test --coverage`, and uploads `coverage/lcov.info`. |
