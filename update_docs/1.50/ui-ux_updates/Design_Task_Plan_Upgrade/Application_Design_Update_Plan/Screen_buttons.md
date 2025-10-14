# Button Inventory & Behaviour

## Button Types
1. **Primary** – Solid background using `color.primary.600`, white text, 16px radius. Used for dominant actions (e.g., Save, Confirm Booking).
2. **Secondary** – Outline style with 2px border `color.primary.600`, transparent fill; used for alternative actions (e.g., View Details).
3. **Tertiary/Ghost** – Transparent background with text `color.primary.600`; used for minimal emphasis actions (e.g., Skip for now).
4. **Destructive** – Solid `color.error.600` with white text; for irreversible actions (Delete, Cancel Job).
5. **Positive** – Solid `color.success.500` for confirm steps (Mark Complete).
6. **Floating Action Button (FAB)** – Circular 56px, gradient fill, drop shadow level 4, houses plus icon.

## Sizes
- **Large:** Height 56px, horizontal padding 24px – used on hero screens and forms.
- **Medium:** Height 48px – default size for most buttons.
- **Small:** Height 40px – used in cards or toolbars.

## States
- Default, Hover (lighten fill by 5%), Pressed (darken fill by 10% + reduce elevation), Disabled (reduce opacity to 40%, remove elevation), Focus (3px outline `color.info.500`).
- Loading state includes inline spinner preceding label; spinner inherits button text colour.

## Accessibility
- Minimum touch target 48x48px regardless of visual size; ensure voiceover label describes action and context.
- Buttons in sequences labelled with next step (e.g., "Continue to Schedule") to aid comprehension.

## Placement Guidelines
- Place primary button at bottom of screen for forms, preceded by summary of changes where applicable.
- Use button groups for multi-action footers; maintain 12px spacing between buttons.
- For destructive actions, confirm via secondary modal with button order Cancel (left) / Confirm (right).

## Analytics
- Track `button_click` event with properties `label`, `screen_id`, `state`, `variant`.
