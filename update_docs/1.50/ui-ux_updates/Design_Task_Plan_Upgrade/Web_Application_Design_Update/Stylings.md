# Styling Guidelines Summary

## Palette & Tokens
- Use design tokens defined in `Colours.md`; manage via CSS variables for theming.
- Maintain consistent spacing scale (4/8/12/16/24/32).

## Typography
- Apply typography rules from `Fonts.md`; ensure headings and body text follow defined scale.
- Use consistent letter spacing and text-transform rules.

## Components
- Buttons, cards, tables, modals share unified corner radius (8px), elevation, and focus styles.
- Ensure hover/active/focus states defined for interactive elements.

## Imagery
- Use consistent style for illustrations (flat vector with gradient highlights).
- Provide alt text and ensure image brightness balanced with overlay when text present.

## Motion
- Adopt easing `cubic-bezier(0.4,0.0,0.2,1)` with durations 150–300ms depending on component.
- Respect `prefers-reduced-motion` to disable non-essential animations.

## Accessibility
- Maintain contrast ratios (text 4.5:1, icons 3:1), focus outlines 3px.
- Provide error states with icon + text and not rely solely on colour.
