# Form Design Specifications — Phone Application v1.00

## General Rules
- Forms use vertical stacking with 16dp spacing between fields.
- Primary actions remain fixed at bottom of viewport (sticky CTA) for long forms.
- Validation occurs on field blur and submission; errors appear inline with icon.

## Field Styles
| Field Type | Dimensions | Styling | Interaction |
| --- | --- | --- | --- |
| Text Input | Height 56dp | Filled background `#F1F5FF`, radius 16dp, leading icon optional 20dp, label `Inter 13/18` uppercase | Floating label transitions 180ms, error state border `#E74C3C` 2dp |
| Multiline | Min height 120dp | Same as text input, top padding 16dp | Auto expands up to 4 lines |
| Dropdown | Height 56dp | Trailing caret icon 16dp, same fill as text input | Opens modal bottom sheet for >6 options |
| Date Picker | Height 56dp | Calendar icon 20dp, text `Inter 15/22` | Triggers calendar sheet 360×420dp |
| Toggle | 52×32dp | Track `#CBD5F5` default, knob 28dp | Animates 120ms; label placed left |
| Checkbox | 24dp square | Radius 4dp, border `#CBD5F5`, check mark `#FFFFFF` | Supports tristate |
| Radio Button | 24dp circle | Border `#0066F5`, filled `#0066F5` when selected | Used for payment selection |
| Slider | Track width 280dp | Active track `#0066F5`, inactive `#D0DEF9`, thumb 24dp | Shows value label `Inter 13/18` |

## Grouping & Sections
- Use section headers `Manrope 14/20` uppercase with 16dp top margin.
- Within booking wizard, group fields into cards with 16dp padding.
- Provide optional helper text 12/16 grey for context.

## Error Handling
- Error icon `icon_error.svg` 16dp left of message.
- Provide clear instructions: e.g., "Document must be PDF under 10 MB.".
- When multiple errors, display summary toast linking to first invalid field.

## Accessibility
- Labels persist when value entered (floating label).
- Provide `semanticsLabel` and `hint` for assistive tech.
- Use `TextInputAction.next` to move between fields quickly.

## Internationalisation
- Support numeric input with locale decimal separators.
- Date fields use locale-specific format (DD MMM YYYY or MMM DD, etc.).

## Security & Privacy
- Sensitive inputs (password, payment) mask characters; provide toggle.
- Use `TextContentType.oneTimeCode` for OTP field (6 boxes 48×56dp each).
- Avoid storing sensitive data in logs.
- Provide inline encryption indicator (lock icon 16dp) for payment forms; tooltip explains data protection.
- Auto-save progress for multi-step forms (booking, registration) every 5s using local storage; show "Draft saved" toast.
- For document uploads, display compliance notice text `Inter 12/16` referencing privacy policy link.

## Error Copy Library
- Email invalid: "Enter a valid email address like name@example.com".
- Password mismatch: "Passwords don't match. Re-enter to confirm.".
- File too large: "Upload files up to 10 MB. Compress and try again.".
- Required field empty: "This field can't be blank.".

## Focus & Keyboard Management
- Automatically scroll field into view when focused using `Scrollable.ensureVisible`.
- For long forms, provide `FormProgressIndicator` at top showing sections completed.
- Date/time pickers close keyboard before opening modal to avoid layout jump.
