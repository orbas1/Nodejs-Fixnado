# Element Placement Standards — Web Application v1.00

## Global Alignment
- Content anchored to 12-column grid with 96px page margins desktop (reduces to 64px tablet, 16px mobile).
- Use `max-width: 1280px` for text sections; align center with auto margins.
- Sticky header occupies 72px height; offset hero content by 96px to avoid overlap.

## Key Placement Rules
| Element | Placement | Offset |
| --- | --- | --- |
| Logo | Header left, margin-left 24px | Baseline align with navigation text |
| Primary CTA | Top-right within hero or header | 24px spacing from adjacent buttons |
| Breadcrumbs | Top of content area, margin-bottom 16px | Align to left column |
| Page Title | Below breadcrumb, margin-bottom 24px | Spans columns 1–8 |
| Side Panels | Right column 9–12, sticky at 120px offset | Max width 360px |
| Toasts | Top-right, 24px from edges | Stack vertical with 16px gap |
| FAB (mobile) | Bottom-right, 24px from edges + safe area | Use `calc(24px + env(safe-area-inset-bottom))` |

## Form Placement
- Group related fields into sections with headings left aligned. Provide descriptive help text directly under input.
- Submit button row aligned right, but on mobile full width with 16px side margins.
- Inline validation messages below input, left aligned.

## Modal & Drawer Placement
- Modals centered horizontally/vertically with `max-width: 720px` (large) or `480px` (standard).
- Drawer slides from right, width 420px (desktop), 360px (tablet), 100% (mobile). Provide close icon top-right 24px from edges.

## Table Placement
- Tables 100% width with horizontal scroll container for overflow; sticky first column optional.
- Bulk actions bar sticky bottom 0 with drop shadow.

## Map Placement
- Explorer map pinned left with `position: sticky; top: 72px;` to remain visible.
- Filter controls overlay top-left with 24px offset to avoid overlapping map controls.

## Accessibility Considerations
- Keep focusable elements in logical order (left → right, top → bottom).
- Provide additional spacing around interactive elements on mobile to avoid accidental taps.
- Ensure placement adjustments respect `prefers-reduced-motion` by disabling transitions when necessary.
