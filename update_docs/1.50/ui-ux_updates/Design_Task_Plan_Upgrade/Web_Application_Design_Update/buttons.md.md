# Button System Specification (Web)

## Variants
- **Primary** – Solid navy background, white text, shadow level 1.
- **Secondary** – Outline navy border, transparent background.
- **Tertiary** – Text-only with underline on hover.
- **Destructive** – Solid red background, white text.
- **Ghost** – Transparent background for actions on coloured surfaces.

## Sizes
- Large 56px height (hero sections), Medium 48px (default), Small 40px (tables, cards).

## States
- Default, Hover (lighten/darken by 6%), Active (press state), Focus (3px sky outline), Disabled (40% opacity, remove pointer events), Loading (spinner left of label).

## Placement
- Primary action placed at right side of forms and dialogs; destructive left to encourage caution.
- Provide consistent spacing (16px) between adjacent buttons.

## Accessibility
- Ensure labels descriptive, avoid duplicates on same page.
- Provide keyboard activation via Enter/Space.

## Analytics
- Emit `button_click` with label, location, variant, state.
