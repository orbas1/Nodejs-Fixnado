# Event & Streaming Updates – Version 1.50

## 2025-04-15 – Live Feed SSE Broadcasts
- Introduced SSE event payloads (`connected`, `heartbeat`, `snapshot`, `post.created`, `bid.created`, `bid.message`) emitted from `liveFeedStreamService` so dashboards receive real-time marketplace activity.
- Snapshot events include generated timestamps plus zone and out-of-zone metadata, keeping React and Flutter clients aligned with filter selections while heartbeat events refresh last-seen telemetry.
