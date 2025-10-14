# Cards Inventory & Specifications

## Purpose
- Document every card component within the provider mobile app, outlining purpose, data inputs, interactive states, and dependencies.

## Card Types
1. **KPI Summary Card**
   - Displays headline metric (e.g., Weekly Revenue), delta vs. previous period, sparkline, and tap target to analytics screen.
   - States: Default, Loading (skeleton), Alert (negative trend), and Disabled (insufficient data).
   - Data sources: Analytics API `GET /providers/:id/metrics` with caching window of 15 minutes.
2. **Action Queue Card**
   - Contains checklist item with due date, priority badge, and CTA button (Complete/Review/Contact Support).
   - Supports swipe interactions for snooze (24h) or mark complete.
   - Emits events `action_queue_card_snoozed`, `..._completed` for analytics.
3. **Job Preview Card**
   - Shows client name, job type, location, payout, and status tags; tapping opens job detail.
   - Additional quick action icons for Accept/Negotiate/Decline when status = Pending.
   - Handles offline caching to show last-synced data with stale indicator.
4. **Financial Transaction Card**
   - Details payout amount, schedule date, job reference, fees breakdown, and help link.
   - Expandable section reveals transaction history and attachments.
5. **Support Resource Card**
   - Presents article title, summary, category icon, and estimated read time; deep links to knowledge base.
   - Includes "Was this helpful?" micro-interaction.

## Design Tokens
- Padding: 20px vertical, 24px horizontal.
- Corner radius: 16px standard; 20px for hero cards.
- Elevation: Level 1 default, level 3 on hover/focus.
- Iconography: 24px stroke icons aligned to 2px grid.

## Accessibility
- Ensure text contrast 4.5:1; use semantic roles for cards depending on content (e.g., `button` role for actionable cards).
- Provide large touch targets (min 48px) for quick action icons.
- Include descriptive labels for screen readers summarising key data points.

## Future Enhancements
- Explore inline editing for certain card fields (e.g., job notes).
- Evaluate card stacking for upcoming backlog to surface more insights without overwhelming.
