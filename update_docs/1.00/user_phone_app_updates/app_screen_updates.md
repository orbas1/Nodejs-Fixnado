## 2025-10-22 — Communications Screens
- Documented mobile communications hub drawing alignment: conversation list mirrors `App_screens_drawings.md` with unread badges, AI assist indicators, and quiet-hour alerts. Screen spec references new Riverpod controller outputs and backend payload keys.
- Added video escalation sheet UX capturing Agora session countdown, microphone/camera toggles, compliance consent copy, and fallback dial-in instructions, ensuring parity with web Agora launcher.
- Updated notification centre overlay design notes to include conversation pinning, urgent flag display, and offline resend banners consistent with new backend delivery statuses.

## 2025-11-02 — Analytics Dashboard Screens
- Captured mobile persona dashboard layouts (overview metrics grid, insights rail, rental table, workflow board, settings panels) to mirror `dashboard_drawings.md` and `App_screens_drawings.md`. Notes call out card spacing, gradient usage, badge tokens, and sidebar highlights so Flutter implementation matches design intent.
- Documented offline banner, export snackbar, and timezone chip behaviours including localisation strings, iconography, and telemetry IDs (`analytics.dashboard.metric.view`, `analytics.dashboard.export`).
- Added custom chart treatment guidance (spark bars/lines), accessibility descriptions, and QA selectors for metrics, tables, and workflow items, linking to new controller tests and repository caching expectations.
