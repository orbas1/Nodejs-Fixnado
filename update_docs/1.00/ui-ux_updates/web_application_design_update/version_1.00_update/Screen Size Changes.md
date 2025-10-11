# Responsive Breakpoints & Screen Size Adaptations — Web Application v1.00

## Breakpoint Summary
| Label | Min Width | Max Width | Grid Columns | Gutter | Margin | Typography Scaling |
| --- | --- | --- | --- | --- | --- | --- |
| `xxl` | ≥ 1600px | ∞ | 12 columns, 88px gutters | 28px | 160px | Headings `clamp(40px, 3vw, 52px)` |
| `xl` | 1440px | 1599px | 12 columns, 80px gutters | 24px | 120px | Base size 18px body |
| `lg` | 1280px | 1439px | 12 columns, 72px gutters | 24px | 96px | Body 17px, headings reduce by 2px |
| `md` | 1024px | 1279px | 8 columns, 72px columns, 20px gutters | 72px | 72px | Body 16px |
| `sm` | 768px | 1023px | 6 columns, 64px columns, 20px gutters | 48px | 48px | Body 16px, hero headings `clamp(28px, 6vw, 36px)` |
| `xs` | 480px | 767px | 4 columns, 72px columns, 16px gutters | 24px | 24px | Body 15px |
| `xxs` | ≤ 479px | — | 4 columns, 64px columns, 12px gutters | 16px | 16px (safe area adjustments) | Body 15px, reduce line height |

## Layout Adjustments
- **Navigation**
  - `xl`/`lg`: Sidebar 264px with labels; `md`: Sidebar collapses to 88px icon rail with tooltips; `sm` and below: hide sidebar, show hamburger controlling overlay drawer 320px width.
  - Top bar reduces height from 72px to 64px at `sm`, search input width clamps to `clamp(240px, 35vw, 320px)`.
  - Bottom navigation appears at `xs`/`xxs` with safe-area padding `env(safe-area-inset-bottom) + 16px`.
- **Hero Sections**
  - `xl`: Hero height 520px, grid with text width 6 columns and imagery 6 columns.
  - `md`: Hero compresses to 440px height, search bar full width 100%, CTA buttons stack horizontally with 12px gap.
  - `xs`: Hero height 420px, background uses centre crop, CTAs stack vertically 12px gap, search bar becomes 100% width, drop shadow reduced.
- **Map Explorer**
  - `xl`: Map 60%, list 40% (min width 420px). `lg`: Map 55%, list 45%.
  - `md`: Map occupies top 50vh, list bottom with sticky filters.
  - `sm`: Map collapses to 40vh with toggle; filter drawer becomes full-screen overlay.
  - `xs`: Default to list view; map accessible via `View map` button opening overlay (100% width, 70vh height) with close button 48px.
- **Tables**
  - `xl/lg`: Full table layout with 6–8 columns.
  - `md`: Hide non-critical columns (e.g., `Created By`). Provide `More details` link.
  - `sm/xs`: Convert to card view using accordion pattern (header row becomes summary, details collapse). Buttons full width 100%.
- **Forms**
  - `xl/lg`: Two-column layout (8/4). `md`: Side-by-side sections reduce to 6/2. `sm`: Single column stack; apply `gap: 24px`.
  - Input width `min(520px, 100%)`. Grouped inputs (date range) stack vertically at `xs`.

## Typography Scaling
- `heading-xl`: `clamp(40px, 3.6vw, 56px)` desktop; `clamp(28px, 7vw, 40px)` mobile.
- `heading-lg`: `clamp(32px, 2.6vw, 40px)` desktop; `clamp(24px, 5vw, 32px)` mobile.
- Body text uses CSS variable `--font-size-body` per breakpoint. `xxs` sets 15px to maintain readability.
- Overlines remain 12px but adjust letter spacing from 0.12em to 0.16em at `xxs` to avoid blur.

## Density Modes
- Provide `density` toggle affecting card/table padding: `comfortable` (default), `compact` (-4px vertical), `condensed` (-8px). At `xs`, auto switch to `comfortable` to maintain touch targets.
- `density` selection stored per user and applied via CSS attribute `[data-density="compact"]` adjusting padding variables.

## Safe Area Handling
- Add `padding-bottom: calc(env(safe-area-inset-bottom) + 16px)` to bottom nav and drawers on devices with notches.
- On `xxs`, ensure modals use `max-height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 32px)` and `overflow-y:auto`.

## Asset Responsiveness
- Hero imagery served via `<picture>`: sources 576w, 768w, 1024w, 1440w, 1920w. Use `sizes` attribute `'(max-width: 767px) 100vw, (max-width: 1279px) 90vw, 1440px'`.
- Map sprites have 1x and 2x versions. Load 2x at `window.devicePixelRatio ≥ 1.5`.
- Illustrations scale to `max-width: min(520px, 90vw)` with `object-fit: contain`.

## Behavioural Adjustments
- Drawer transitions faster on mobile (240ms) to compensate for screen size; reduce overlay opacity to 0.4 to keep context visible.
- Carousel auto-play disabled at `xs` to reduce motion; manual swipe gestures with 16px bleed for affordance.
- Tooltips convert to inline helper text at `xs/xxs` to avoid hover dependency.

## Testing Matrix
| Device | Resolution | Breakpoint | Critical Checks |
| --- | --- | --- | --- |
| MacBook Pro | 1512×982 | `xl` | Sidebar collapse toggle, hero gradient alignment |
| Surface Pro | 1280×800 | `lg` | Map/list ratio, sticky filters |
| iPad Air (landscape) | 1180×820 | `md` | Two-column forms, command palette width |
| iPad Mini (portrait) | 768×1024 | `sm` | Drawer overlay, bottom nav hidden |
| iPhone 14 Pro | 393×852 | `xs` | Bottom nav safe-area, hero stacking |
| Pixel 5 | 393×851 | `xs` | Map overlay, filter drawer |
| iPhone SE (2nd gen) | 375×667 | `xxs` | Form field stacking, CTA readability |

## Implementation Notes
- Use CSS container queries for cards to adjust internal layout (two-column info when `min-width: 540px`).
- `useBreakpoint` hook returns `xxl|xl|lg|md|sm|xs|xxs` string; caching ensures SSR/CSR parity.
- Provide screenshot references per breakpoint in Figma (`Pages > Responsive Frames`). Engineers must upload implementation screenshots to PR referencing spec section.
