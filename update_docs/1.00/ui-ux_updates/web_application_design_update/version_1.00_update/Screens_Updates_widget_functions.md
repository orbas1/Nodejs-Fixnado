# Component Functional Specs — Web Application v1.00

## Buttons
- Primary buttons trigger main action; include loading state (spinner 20px). Disabled state reduces opacity 0.4 and removes pointer events.
- Secondary buttons used for secondary actions; maintain keyboard focus outline.
- Icon buttons include tooltip on hover/focus using `aria-describedby`.

## Navigation Components
- Sidebar items update URL via Next.js router push; maintain `aria-current="page"` for active route.
- Top bar menus open dropdowns with arrow key navigation and ESC to close.
- Mobile bottom nav uses `role="tablist"`; icons labelled for screen readers.

## Cards
- Metric cards clickable when deep linking to analytics; include hover elevation increase.
- Provider cards open detail modal; CTA buttons within card override card click to avoid double navigation.
- Task cards support drag-and-drop (kanban). Provide `aria-grabbed` attributes and fallback action menu.

## Tables
- Column headers clickable to sort; show icon (chevron) orientation to indicate sort direction.
- Rows support selection via checkbox (24px). Provide keyboard navigation with `tabindex="0"`.
- Inline actions accessible through `Menu` triggered by icon button.

## Forms
- Inputs use controlled state with validation on blur and submit. Display inline error text and icon.
- Combobox supports typeahead; asynchronous search shows spinner in menu.
- Date picker allows range selection for bookings; highlight selected range.
- Multi-step forms maintain state in context; stepper indicates progress.

## Modals & Drawers
- Trap focus inside modal; `ESC` closes. Provide close icon 24px top-right.
- Drawers used for detail views; allow closing by clicking backdrop or pressing ESC.
- When modal open, page scroll locked (`overflow: hidden`).

## Maps & Charts
- Map interactions update result list; throttle updates 500ms.
- Chart tooltips accessible via keyboard; provide data table toggle for screen readers.

## Feedback
- Toast auto-dismiss 5s, manual close button 16px. Provide `role="status"` for success, `role="alert"` for errors.
- Inline validation uses `aria-live="polite"`.

## Accessibility
- Ensure all interactive components reachable via keyboard (tab/shift+tab).
- Provide `aria-expanded` on collapsible panels (filters, sidebars).
- Use focus sentinel elements in drawers for returning focus to trigger.
