# Component Functional Specification

| Component | Purpose | Inputs | Outputs/Actions | Notes |
| --- | --- | --- | --- | --- |
| Global Header | Provide navigation, search, utilities | Nav config, user info, notifications | Route changes, open search modal, show notifications | Sticky on scroll, collapses on mobile |
| Command Palette | Quick access to entities | Keyboard shortcut, search query | Opens relevant page, executes action | Debounce search, highlight matching text |
| KPI Tile | Show metrics | Metric value, delta, link | Display data, link to report | Supports loading skeleton and error state |
| Timeline Widget | Visualise events | Event list, filters | Expand detail drawer, highlight active | Scroll synchronisation with chart |
| Resource Card | Present knowledge assets | Title, summary, media | Open article, track engagement | Displays badge for new/updated |
| Export Scheduler | Manage report exports | Filters, recurrence pattern, recipients | Create/Update schedule, validate cron pattern | Shows next run preview |
| Notification Drawer | Show alerts | Alert list, pagination | Mark read, filter categories | Supports keyboard navigation |

## Interaction Guidelines
- All interactive components accessible via keyboard and screen reader labels.
- Emit analytics events prefixed `web_component_<name>_<action>`.
