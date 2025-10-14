# Widget Functions Reference

| Widget | Function | Data Inputs | Output/Actions | Notes |
| --- | --- | --- | --- | --- |
| KPI Metric Tile | Display real-time performance metrics | Revenue, Jobs Completed, Response Time | Shows value, trend, tap to open analytics detail | Refresh interval 15 min; skeleton while loading |
| Action Queue Checklist | Prioritise outstanding tasks | Task type, priority, due date | Complete, Snooze, View details, Contact support | Escalates to dashboard banner if overdue |
| Availability Timeline | Manage schedule slots | Availability template, exceptions, conflicts | Drag to adjust, apply templates, resolve conflicts | Offline edits stored locally until sync |
| Job Timeline | Track job progress | Status history, timestamps, notes | Mark step complete, add note, report issue | Locks previous steps to prevent tampering |
| Expense Upload | Submit receipts | Photos, amount, category | Auto-categorise, edit, submit, split | OCR confidence displayed; manual override |
| Knowledge Base Card | Surface support articles | Article metadata, usage context | Open article, mark helpful | Recommends related content |
| Notification Badge | Indicate unread counts | Message counts, task counts | Visual indicator + accessible label | Max 2 digits, 99+ for overflow |

## Integration Considerations
- Widgets subscribe to event bus for updates to avoid full screen reloads.
- Standardise error messaging and offline states per widget type.
