# Dashboard Design Specifications

## Layout
- 12-column responsive grid; primary KPI strip spans columns 1-12 (desktop) and 1-8 (tablet).
- Secondary widgets arranged in modular 4-column units with drag-and-drop reordering stored per persona.

## Widget Types
- **KPI Tiles:** Display value, delta, trend sparkline, and quick action (e.g., "View report").
- **Task Queue:** Prioritised list with filters (All, Due soon, Overdue) and inline complete/assign actions.
- **AI Insight Panel:** Slide-out drawer summarising recommended actions with rationale and predicted impact.
- **Campaign Performance:** Chart toggles between impressions, CTR, conversion; includes budget usage indicator.
- **Compliance Tracker:** Shows documents expiring soon, gating status, and ability to upload new evidence.

## Interaction
- Hover reveals additional context (e.g., tooltip with data source). Keyboard users can focus widgets via tab order and use arrow keys to rearrange when reorder mode toggled.
- Export controls grouped in top-right toolbar; provide CSV, PDF, and API options.
- Notification badge indicates new insights; clicking opens modal summarising changes since last login.

## Accessibility & Theming
- Provide high-contrast theme options; ensure charts include patterns/markers for colour-blind accessibility.
- Support reduced data density mode for smaller screens, collapsing charts into summary cards.
