# Component Functional Specs — Web Application v1.00

## Buttons & CTAs
- **Primary Button (`<Button variant="primary">`)**
  - Height 56px desktop, 52px tablet, 48px mobile; padding `0 28px` (desktop), `0 24px` (tablet), `0 20px` (mobile).
  - Loading state uses spinner 20px left of label, `aria-busy="true"`, disables pointer events.
  - Emits analytics `button_click` with context `{ id, variant, page }`.
- **Secondary Button**
  - Outline 1px `var(--fixnado-color-primary-500)`, background `transparent`; hover fill `rgba(20,69,224,0.08)`.
  - Supports `data-state="pressed"` for toggles (e.g., filter pills) with background `rgba(20,69,224,0.16)`.
- **Icon Button**
  - Square 44×44px (desktop) / 40×40px (mobile) with 22px radius. Tooltip `aria-describedby` referencing tooltip ID; ensures focus ring `outline: 3px`.

## Navigation & Panels
- **Sidebar Navigation**
  - Items 52px height with icon 24px left, label 16px. Active state: left border 3px `var(--fixnado-color-primary-500)` and background `rgba(20,69,224,0.12)`.
  - Keyboard navigation uses roving tabindex; arrow keys move focus, Enter triggers route.
  - Collapsible sections maintain `aria-expanded` state and animate height 200ms.
- **Top Command Bar**
  - Hosts search field (width clamp 240–360px), notifications, profile menu. Scroll state adds shadow `var(--fixnado-shadow-2)` and reduces height to 64px.
- **Bottom Navigation (mobile)**
  - Four items, each 56px height, icon 24px, label 12px. Active item uses `color: var(--fixnado-color-primary-500)` and indicator dot 4px.

## Cards & Tiles
- **KPI Tile**
  - Contains icon circle 48px, metric value `font-family: 'IBM Plex Mono' 28/32`, support text `Inter 14/22`.
  - Hover: translateY(-4px), apply `var(--fixnado-shadow-2)`. Click opens analytics drawer.
- **Provider Card**
  - Layout: left image 132×132px with 16px radius, right column stack `gap: 12px`. CTA row with primary + ghost buttons 140×44px each.
  - Rating badge top-left `height: 32px`, icon star 16px, background `rgba(255,255,255,0.9)`.
  - Quick compare toggle (checkbox) top-right uses `Switch` component (32px track, 18px thumb).
- **Campaign Card**
  - Background image 280×360px with gradient overlay `rgba(11,17,32,0.64)`. Title `Manrope 20/28` white, summary `Inter 16/24` white 70%.
  - CTA button full width 48px height anchored bottom 24px from edge.

## Tables & Data Grids
- Table header height 56px, text `Manrope 13/18` uppercase with letter spacing 0.08em.
- Columns support resizing: handle width 8px, hit area 16px, focus outline 3px.
- Row height 72px; selection checkbox 24px. Multi-select triggers command bar 56px high with actions aligned right.
- Inline actions accessible via `Menu` anchored to 32×32 icon button; keyboard accessible via `Shift+F10`.
- Empty state card 320×240 with illustration `empty-table.svg`, CTA ghost button 48px height.

## Forms & Inputs
- Text input height 48px, border radius 12px. Label `Manrope 14/20` uppercase (optional). Helper text `Inter 13/18`.
- Validation states: error border `var(--fixnado-color-danger-500)`, success `var(--fixnado-color-secondary-500)`. Icons 16px appended right.
- Select/Combobox uses overlay list 320px width min, items 44px height. Async search displays spinner 16px at right.
- Date picker grid 7×6 cells, each 44×44px; selected range highlight `rgba(20,69,224,0.12)` with border `#1445E0`.
- Stepper forms maintain summary sidebar with autosave indicator (dot pulsating `#00B894`).

## Modals, Drawers & Overlays
- Modal width 720px default, 960px for analytics, 100% width on `xs`. Radius 16px, padding 32px. Title `Manrope 24/32`, close icon 24px.
- Drawer width 420px desktop, 360px tablet, 100% mobile. Backdrop `rgba(12,18,32,0.4)` with 12px blur.
- Focus trap ensures first focusable element receives focus; ESC closes; clicking outside closes except when `data-modal="persistent"` set (settings).
- Confirm dialogs include icon (40×40), headline `Manrope 20/28`, actions primary/danger button pair.

## Maps & Charts
- Map controls: zoom buttons 44×44px, circular with background `rgba(11,17,32,0.72)` and icon white. Hover lighten to `rgba(11,17,32,0.88)`.
- Filter drawer includes segmented control 48px height, slider track 8px with handle 20px.
- ECharts theme uses palette `[ '#1445E0', '#1BBF92', '#FFB020', '#0EA5E9' ]`. Tooltip card 280×160px with background `#FFFFFF`, border radius 16px.
- Sparkline component in table summary uses `stroke-width: 2px`, gradient fill 24% opacity.

## Feedback & Messaging
- Toast width 360px (desktop) / 100% minus 32px (mobile). Display 5s. Contains icon 20px left, title `Manrope 16/24`, message `Inter 14/22`.
- Snackbar anchors top-right desktop, bottom centre mobile. Buttons inside 32px height ghost style.
- Inline alerts (within forms) have 4px left border and icon 20px. Provide `aria-live="assertive"` for errors, `polite` for success.
- Chat bubbles: agent background `rgba(20,69,224,0.12)` with 12px radius, user background `rgba(14,165,233,0.2)`. Timestamp `Inter 12/16` grey 60%.

## Accessibility Hooks
- All interactive widgets include `tabindex="0"` when necessary and `aria-` attributes documented in component README.
- Provide skip links (`Skip to map`, `Skip to table`) visible on focus with 3px outline.
- Drag-and-drop (kanban) includes keyboard alternatives: pressing Space toggles `aria-grabbed`, arrow keys move between columns, Enter drops.
- Tooltips convert to inline helper text when `prefers-reduced-motion` or `touch` pointer detected.

## Telemetry Hooks
- Each widget emits events with naming `domain_component_action`. Examples: `explorer_filter_apply`, `dashboard_kpi_click`, `marketplace_package_select`.
- Event payload includes `page`, `componentId`, `variant`, `userRole`. For tables include row count and filter state.
- Logging consumed by Segment → Snowflake; ensure payload size < 6KB.

## Error Handling
- Loading states use skeleton placeholders for cards (rounded rectangles) and shimmering rows for tables.
- On failure, display inline error with icon `warning-24.svg`, message, retry button. Provide `Retry` calls underlying fetch again with exponential backoff (2s, 4s, 8s).
- Offline detection: show banner `You're offline` with grey background `rgba(148,163,184,0.16)` and attempt to load cached data.

## Implementation Notes
- Each widget documented in Storybook with controls. Include knobs for `loading`, `error`, `empty`, `dark mode`, `compact density`.
- Use TypeScript generics for tables to enforce typed rows and columns. Provide `getKey` function for stable keys.
- Unit tests to cover `ARIA` attributes, event emission, keyboard navigation (React Testing Library + user-event).
- Export CSS mixins for common padding/shadows in `Scss.md` to maintain parity across legacy stylesheets.
