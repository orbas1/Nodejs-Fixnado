# Button System — Web Application v1.00

## Variants
| Variant | Dimensions | Style | Usage |
| --- | --- | --- | --- |
| Primary | min-width 160px, height 52px | Gradient `#1445E0 → #1C62F0`, radius 12px, text white | Main CTAs |
| Secondary | min-width 160px, height 52px | Border 1px `#1445E0`, text `#1445E0` | Supporting actions |
| Ghost | min-width 140px, height 48px | Transparent background, text `#1445E0` with underline on hover | Low emphasis |
| Destructive | min-width 160px, height 52px | Fill `#E85A5A`, hover `#C94C4C` | Danger actions |
| Icon Button | 40×40px | Circular, background `rgba(12,18,32,0.08)` | Toolbar, map controls |
| Split Button | 200×52px | Primary left, caret button 52px width | Export/download menus |

## States
- Hover: Increase brightness 8%, elevate shadow `0 12px 32px rgba(12,18,32,0.16)`.
- Active: Translate Y 1px, darken gradient 10%.
- Focus: Outline 3px `#0EA5E9`.
- Disabled: Reduce opacity 0.4, cursor `not-allowed`.

## Loading
- Replace label with spinner 20px + optional text `Loading…`. Maintain width.

## Icons
- When icon leading, spacing 12px. When trailing, spacing 8px.

## Implementation
- Use `@fixnado/ui` `<Button variant="primary" size="md">` pattern. Underlying component uses CSS variables for tokens.
- Provide `aria-live="polite"` updates for loading states.

## Accessibility
- Buttons accessible via keyboard, ensure `type` attribute set (submit/button).
- Provide text alternatives for icon-only buttons via `aria-label`.
