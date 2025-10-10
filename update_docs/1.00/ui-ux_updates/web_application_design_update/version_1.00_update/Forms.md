# Form Design — Web Application v1.00

## Structure
- Use two-column forms (fields span 6 columns) on desktop; single column on mobile.
- Section headings `heading-sm` with 24px top margin.

## Field Specs
| Field | Height | Styling | Notes |
| --- | --- | --- | --- |
| Text Input | 48px | Border 1px `#CBD5F5`, radius 12px, padding 0 16px | Focus border `#1445E0` 2px |
| Textarea | 128px min | Same as input, vertical resize disabled | Provide character count |
| Select | 48px | Custom combobox, arrow icon 16px | Supports search, multi-select chips |
| Checkbox | 20px | Border 2px `#1445E0`, 4px radius | Align with label `Inter 16/24` |
| Radio | 20px | Outer ring 2px `#1445E0`, inner dot 12px | |
| Toggle | 44×24px | Background `rgba(20,69,224,0.16)` inactive, `#1445E0` active | Handle 20px |
| Date Picker | 48px trigger | Calendar overlay 320px width | Allows range select |
| File Upload | 100% width, height 200px | Dashed border `#1445E0`, icon 48px | Drag-and-drop |

## Validation
- Inline errors below field, `Inter 14/20`, colour `#E85A5A`.
- Provide summary banner at top for multi-error submissions.
- Required fields marked with asterisk and `aria-required="true"`.

## Interaction
- Submit button disabled until required fields valid.
- Auto-save forms show spinner next to label with "Saved" status text.
- Keyboard navigation: tab order left-to-right, top-to-bottom.

## Accessibility
- Associate labels via `for` and `id` attributes.
- Provide `aria-describedby` linking to helper or error text.
- Ensure colour not sole indicator of error (include icon and text).

## Internationalisation
- Support locale-specific date/time formats.
- Mirror layout for RTL: field alignments flip, maintain padding.
