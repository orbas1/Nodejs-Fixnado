# Screen Updates – User App

- Session bootstrap now includes a silent hydration step that determines whether biometrics are required before enabling authenticated navigation; UI will prompt via the forthcoming security modal when the biometric gate is triggered.
- Added a full-screen consent overlay that blocks navigation until required policies are accepted, including ledger-backed timestamps, policy version chips, and scroll-aware acceptance controls.
- Updated legal screens to render the refreshed privacy/terms content with shared typography tokens; staleness badges prompt users when re-acceptance is required.
- Introduced `DataRequestsScreen` providing GDPR request submission, filtering, export triggers, and retention-aware messaging backed by the new repository/controller stack.
- Surfaced the compliance entry card inside `ProfileManagementScreen`’s legal section with live counts, latest submission timestamps, and retry affordances.
- Extended `DataRequestsScreen` with a Warehouse tab presenting dataset/region segmentation, run history timeline cards, retention countdown chips, and action buttons to re-trigger exports or copy secure download URLs.
- Added inline error/success snackbars plus "view DPIA guidance" deep links anchored to the new operations documentation so mobile operators receive just-in-time support when managing exports.
- Introduced compliance KPI banners summarising backlog, overdue, and completion metrics with refresh affordances plus due-at labels on each request row so SLA breaches surface directly within the list.
- Added empty/loading/error states for the metrics panel and pull-to-refresh hook that refreshes both metrics and requests, ensuring mobile parity with the web dashboard.
- Refined the Finance Dashboard with escalation trays, Slack/Opsgenie delivery pills, and retry countdown chips that mirror the backend fan-out service while keeping summary tiles responsive on compact screens.
