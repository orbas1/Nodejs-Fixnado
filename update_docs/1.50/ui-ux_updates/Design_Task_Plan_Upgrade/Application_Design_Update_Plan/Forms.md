# Form Design Standards

## Goals
- Ensure data entry experiences are intuitive, forgiving, and optimised for mobile interactions.
- Provide consistent validation, helper messaging, and error recovery patterns across the app.

## Structure
- Forms organised into sections with labeled group headers; when exceeding one screen height, provide sticky summary CTA.
- Each field includes label, optional helper text, error message slot, and validation icon.
- Mandatory fields marked with "Required" tag rather than asterisk to improve clarity.

## Components
- **Text Input:** 48px height, filled background, 2px border; icons inside left or right when necessary.
- **Dropdown / Select:** Modal bottom sheet with search field for long lists; multi-select uses chips to display chosen options.
- **Date & Time Pickers:** Native pickers with custom header summarising selection; includes quick chips for "Today", "Tomorrow", "Next Week".
- **Toggle & Switches:** For binary options; include description and optional subtext.
- **Stepper:** For quantity entry; includes hold-to-increment and manual input fallback.
- **Upload:** Drag-and-drop area with dashed border on tablet, button + icon on mobile; displays upload progress and retry controls.

## Validation
- Real-time validation where feasible; otherwise, validate on blur/submit with aggregated error summary at top.
- Error copy describes issue and how to fix (e.g., "Certification expiry must be in the future").
- Success states show subtle green check icon; asynchronous validations show spinner inline.

## Accessibility
- Input fields support larger text, maintain sufficient padding, and include programmatic labels.
- Form wizard steps announced to screen readers along with progress ("Step 2 of 5 – Schedule").
- Provide keyboard navigation support for external keyboard users.

## Error Recovery & Persistence
- Auto-save progress for multi-step forms; if session interrupted, resume from last completed step.
- Provide undo for destructive actions (e.g., removing team member) with 5-second toast.
- Offline mode caches inputs and queues submission when connectivity returns; display sync indicator.
