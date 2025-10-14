# Form Design Framework (Web)

## Structure
- Group related fields with headings and optional description text.
- Use two-column layout on desktop when space allows; stack on tablet/mobile.
- Provide progress indicator for multi-step forms and breadcrumb when nested within workflows.

## Components
- Text inputs, select dropdowns with search, date pickers, time pickers, toggle switches, radio button groups, file uploads.
- Inline validation states with icons and helper messages.
- Summary panel at top or side summarising key details.

## Validation
- Validate on blur and on submit; show consolidated error summary anchoring to fields.
- For async validations (e.g., provider lookup) show spinner with accessible label.
- Provide autosave for long forms with status indicator.

## Accessibility
- Labels associated via `for`/`id`, aria-describedby for helper text.
- Keyboard navigation: tab order matches visual order, focus outlines visible.
- Provide instructions for required format (e.g., `YYYY-MM-DD`).

## Error Handling
- Provide inline error message plus global alert summarising issues.
- Offer retry for network failures; keep entered data intact.

## Analytics
- Track field completion times for critical forms (quote request, report builder) to identify friction points.
