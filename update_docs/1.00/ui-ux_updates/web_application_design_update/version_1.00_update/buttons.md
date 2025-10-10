# Button Specifications — Web Application v1.00

## Button Matrix
| Variant | Size | Padding | Border Radius | Font | Use Cases |
| --- | --- | --- | --- | --- | --- |
| Primary | Large 56px height | 0 28px desktop, 0 24px tablet, 0 20px mobile | 12px | Manrope 600 16/24 | Primary CTAs (Book now, Launch campaign) |
| Secondary | 48px | 0 24px | 12px | Manrope 600 16/24 | Secondary actions (Preview, Save draft) |
| Tertiary | 44px | 0 16px | 12px | Inter 600 16/24 | Inline actions, toolbar buttons |
| Ghost | 44px | 0 16px | 12px | Inter 600 16/24 | Low emphasis (View details) |
| Destructive | 48px | 0 24px | 12px | Manrope 600 16/24 | Critical actions (Cancel booking) |
| Icon (Circle) | 44×44px | — | 22px | Icon only | Toolbars, map controls |
| Floating Action | 64×64px | — | 32px | Icon + label (optional) | Mobile quick create |

## State Styling
| State | Primary | Secondary | Destructive |
| --- | --- | --- | --- |
| Default | Background `#1445E0`, text white | Border `1px solid #1445E0`, text `#1445E0` | Background `#E85A5A`, text white |
| Hover | `#0E33A8`, elevate `translateY(-1px)` | Background `rgba(20,69,224,0.12)` | `#C94C4C` |
| Active | `#0A2578`, inset shadow `0 2px 0 rgba(0,0,0,0.12)` | `rgba(20,69,224,0.2)` | `#A63C3C` |
| Focus | Outline `3px #0EA5E9`, offset 2px | Same outline | Outline `3px #F87171` |
| Disabled | `rgba(20,69,224,0.32)`, text `rgba(255,255,255,0.64)` | Border `rgba(20,69,224,0.24)`, text `rgba(20,69,224,0.48)` | `rgba(232,90,90,0.32)` |

## Layout Rules
- Buttons align to 8px grid; maintain 16px gap between siblings, 24px between groups.
- Within forms, primary button placed rightmost, secondary left. On mobile, stack with primary on top.
- Floating action button offset from bottom-right by 24px desktop, 20px mobile; account for safe-area padding on iOS (add 12px).

## Iconography
- Icon-only buttons: icons 24px, centered with optical alignment. Provide `aria-label`.
- Icon + text: icon left with 12px gap to text. For right arrow, align to trailing edge.
- Loading state: show spinner 20px left of text, reduce text opacity to 0.72, disable pointer events.

## Interaction Feedback
- Ripple effect disabled on web; use opacity fade 80ms for click acknowledgement.
- Provide `data-state="loading"` attribute toggled by controllers to assist automated testing.
- Buttons controlling overlays change label to reflect action (e.g., "Close filters").

## Implementation Notes
- Use `<Button>` component from `@fixnado/ui` with variants `primary`, `secondary`, `tertiary`, `ghost`, `danger`.
- Responsive adjustments using CSS `@media (max-width: 480px)` to increase vertical padding by 4px for larger touch target.
- Accepts `size` prop: `lg`, `md`, `sm`. For tables, use `sm` 36px height with condensed padding 0 12px.
- Buttons should never wrap text; enforce `white-space: nowrap`. Use shorter labels or convert to menu.

## Analytics & Accessibility
- Emit event `button_click` with `data-action` attribute value.
- Ensure all buttons reachable via keyboard; `Enter` and `Space` triggers.
- Provide tooltip for icon-only buttons; use `aria-describedby` linking to tooltip ID.
