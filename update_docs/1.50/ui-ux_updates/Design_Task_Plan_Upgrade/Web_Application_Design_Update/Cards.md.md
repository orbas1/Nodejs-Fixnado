# Card Specifications & States

| Card | Content Structure | States | Interactions |
| --- | --- | --- | --- |
| Marketplace Service | Media (16:10), title, rating, compliance badges, price, action buttons | Default, hover/focus (show quick stats), unavailable (grey overlay), sponsored (badge) | Click → detail page, quick view modal, add to comparison |
| Package Bundle | Title, list of inclusions, savings badge, pricing tiers, CTA stack | Default, recommended (accent border), discount (banner), limited availability | Toggle add-ons, expand details, share link |
| Custom Job | Title, requester, zone, deadline, bid count, SLA chip, assigned team | Draft, awaiting bids, shortlisted, awarded, blocked | Drag between kanban columns, open slide-over detail, attach files |
| Inventory Asset | Image, utilisation %, maintenance status, quantity, last service date | Available, reserved, maintenance due, retired | Inline edit quantity, schedule maintenance, view history |
| Analytics KPI | Metric value, delta indicator, timeframe, sparkline | Loading (skeleton), normal, target breached (warning), goal met (success) | Expand to chart modal, change comparator, export |
| Notification | Icon, headline, timestamp, message snippet, action link | Info, success, warning, danger, archived | Dismiss, snooze, mark as read, open related record |

## Anatomy
- Maintain 24px padding on desktop, 16px on mobile.
- Include consistent metadata row (icons + labels) for compliance/regulation context.
- Provide placeholder skeletons for image loading; fallback to monogram on missing provider images.
