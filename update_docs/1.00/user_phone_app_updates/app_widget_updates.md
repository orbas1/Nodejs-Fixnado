# Widget Updates — 2025-02-09

- `LiveFeedList` now accepts injected items, exposes loading/empty states, and surfaces high-priority badges plus SLA messaging to match dashboard drawings.
- Added optional retry control for empty feeds, aligning with incident response UX and allowing QA to assert refresh flows.
- Created widget tests (`test/widgets/live_feed_list_test.dart`) covering populated, empty, and loading scenarios so mobile automation can reference deterministic expectations.

## 2025-10-22 — Communications Widgets
- Added `ConversationRail` and `MessageComposerSheet` widgets within communications presentation layer to surface unread badges, AI assist chips, attachment previews, and quiet-hour warnings aligned to drawings.
- Widgets expose `onOverrideQuietHours`, `onLaunchVideo`, and `onRetrySend` callbacks to integrate with communications controller while maintaining accessibility semantics (semantic labels, focus order) for screen readers.
- Updated widget theming to reuse design tokens for message bubble backgrounds, urgency stripes, and AI assist hints; telemetry IDs allow analytics to monitor mobile adoption and quiet-hour override behaviour.

## 2025-11-02 — Analytics Widgets
- Added responsive analytics components (`AnalyticsChartCard`, `_SidebarSummary`, `_BoardCard`) delivering sparkline/bar visualisations, insight rails, and workflow columns using Flutter `CustomPaint` with accessible labelling mirroring `Dashboard Designs.md` treatments.
- Metric tiles (`MetricCard`) now support trend icons and change copy so Flutter surfaces match governed analytics palette and accessibility requirements across mobile personas.
- Documented widget-level telemetry selectors, semantic labels, and gradient usage constraints to align design tokens with mobile analytics parity expectations.
