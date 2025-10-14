# Dashboard Organisation Plan

## Section Ordering
1. KPI Strip
2. Operations Timeline
3. Approvals Queue
4. Performance Snapshot
5. Resource Spotlight / Tips
6. Recent Activity Log

## Personalisation
- Users can collapse modules; order persists via user preferences API.
- Provide reset option to revert to default layout.

## Data Refresh
- KPI and timeline data refresh every 5 minutes; manual refresh button available.
- Approvals queue updates in real-time via websockets; fallback poll 30 seconds.

## Empty States
- Display guidance when no data (e.g., "No upcoming jobs – add schedule" with CTA).
- Resource Spotlight rotates evergreen content to avoid empty layout.

## Cross-Linking
- Each module includes deep link to related pages (e.g., Approvals → Requests page).
- Hover tooltips summarise destination to reduce unexpected navigation.

## Accessibility & Responsiveness
- Modules reflow into single column on smaller screens with consistent spacing.
- Ensure logical tab order matches visual arrangement.
