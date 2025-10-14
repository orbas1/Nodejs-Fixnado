# Card Component Catalogue

## Card Variants
1. **Metric Card** – Displays KPI value, delta, sparkline; optional contextual menu for drill-down.
2. **Action Card** – Checklist items with CTA button, due date, priority badge.
3. **Content Card** – Used in resource hub; includes image thumbnail, title, excerpt, tags.
4. **Provider Card** – Marketplace result snippet with ratings, response time, coverage map thumbnail.
5. **Report Card** – Saved report entry with metadata, quick actions (view, edit schedule, export).

## Structure
- Padding 24px desktop, 16px tablet/mobile.
- Header area optional; support icon or avatar.
- Footer area for secondary actions or status labels.

## States
- Default, Hover (elevation + subtle background lighten), Active (border highlight), Disabled (reduced opacity), Loading (skeleton placeholders).

## Accessibility
- Entire card clickable uses `<button>` semantics with accessible label summarising primary info.
- Ensure focus outline visible at 3px accent border.

## Data Binding
- Document data fields per card to ensure consistent API responses.
- Provide fallback states when data missing (e.g., "No rating yet").
