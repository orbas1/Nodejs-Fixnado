# Widget Updates — 2025-02-09

- `LiveFeedList` now accepts injected items, exposes loading/empty states, and surfaces high-priority badges plus SLA messaging to match dashboard drawings.
- Added optional retry control for empty feeds, aligning with incident response UX and allowing QA to assert refresh flows.
- Created widget tests (`test/widgets/live_feed_list_test.dart`) covering populated, empty, and loading scenarios so mobile automation can reference deterministic expectations.
