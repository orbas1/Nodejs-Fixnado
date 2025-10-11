# Component Types — Web Application v1.00

> All sizes in pixels unless otherwise stated. Components align to the 8px spacing grid and respond to breakpoints detailed in `Screen Size Changes.md`. Asset sources and dependencies listed so implementation teams can retrieve exact resources.

## Layout Primitives
| Component | Default Dimensions | Breakpoint Adaptation | Implementation Details | Asset / Dependency |
| --- | --- | --- | --- | --- |
| `AppShell` | Width: 100vw, Height: 100vh | `<1280px` collapses sidebar to 88px icon rail; `<768px` transforms into top-bar + bottom navigation | CSS Grid `grid-template-columns: minmax(264px, auto) 1fr`; header fixed 72px height, safe-area padding via `padding: env(safe-area-inset-top) 24px 0` | `frontend-reactjs/apps/web/src/layouts/AppShell.tsx`
| `GridSection` | 12 columns, 80px width, 24px gutters | Tablet 8 columns 72px width, 20px gutters; Mobile 4 columns 72px width, 16px gutters | Uses CSS custom properties `--grid-columns`, `--grid-gutter` with container queries; aligns to tokens `space-24` etc | `@fixnado/ui/Grid` primitive
| `SplitPanel` | 60/40 or 70/30 ratio | `<1024px` collapses into vertical stack; `<768px` toggled with segmented control | Implements `display:grid; grid-template-columns: minmax(480px, 3fr) minmax(320px, 2fr)`; includes `ResizeObserver` for dynamic min widths | `frontend-reactjs/apps/web/src/components/layout/SplitPanel.tsx`
| `Stack` | Width: parent; gap 24px | Gap adjusts to 32px for hero, 16px for dense forms; `<480px` clamps to 12px | Provided as CSS variable `--stack-gap`; accessible spacing toggled via `density` setting | `@fixnado/ui/Stack`
| `ContentContainer` | Max width 1368px | `<1280px` width reduces to 1120px; `<768px` full width with 16px side padding | Adds `margin-inline: auto`, `padding-inline: clamp(16px, 6vw, 96px)` | Shared in `/frontend-reactjs/apps/web/src/layouts/ContentContainer.tsx`

## Content Modules
| Component | Size & Structure | Behaviour | Asset Source |
| --- | --- | --- | --- |
| `HeroBanner` | Height 520px desktop, 480px tablet, 420px mobile; background `hero-city-grid@2x.jpg` 2880×1200 with gradient overlay | Carousel auto-advances 6s; uses `keen-slider@6`; manual navigation arrows 56×56px; track `hero_slide_change` event | `frontend-reactjs/apps/web/public/assets/hero/hero-city-grid@2x.jpg`
| `KpiTile` | 280×160px, padding 24px, icon circle 48px | Hover elevation +4px, `onClick` opens analytics drawer; supports density toggle reducing padding to 16px | Icons from `@fixnado/icons` (`metric-bookings.svg`, `metric-revenue.svg`)
| `ProviderCard` | 360×200px, left image 132×132px, detail column 208px, CTA row 48px height | Hover reveals quick actions; `View profile` CTA 140×44px; card accessible via `role="article"` | Imagery `assets/providers/*` referenced in `Screens_update_images_and_vectors.md`
| `PackageCard` | 280×360px, top image 280×168px, gradient overlay 40%; text block 120px, CTA 56px | Contains `Add to plan` button; `onHover` animates overlay to 60% and reveals specs | Content from CMS `packages`; overlay assets `marketplace-cleaning@2x.jpg`
| `TestimonialCard` | 420×220px, photo 80×80px, rating stars 5×16px, quote text area 180px | Carousel loops horizontally with pagination dots; `aria-live="polite"` for auto-rotation | Portraits `assets/people/partners/*.jpg`
| `KnowledgeCard` | 560×240px, icon 64px, gradient accent top border 4px | Link opens knowledge hub; `:hover` lighten gradient and show `Read article` arrow | Icon `icon-knowledge.svg`

## Navigation Components
| Component | Metrics | States | Behaviour | Dependencies |
| --- | --- | --- | --- | --- |
| `SidebarNav` | Width 264px; item height 52px; icon 24px; chevron 16px | `default`, `active`, `hover`, `collapsed` | Collapsible groups reveal nested `NavItem` list; `aria-expanded` on groups; collapsed mode shows tooltip (200ms delay) | `frontend-reactjs/apps/web/src/navigation/SidebarNav.tsx`
| `TopBar` | Height 72px; shrink to 64px after scroll 120px; search field width 320px | `default`, `transparent`, `scrolled` | Contains breadcrumbs, search, notifications, account menu; optional command palette trigger (icon 24px) | `TopBar` component uses `framer-motion` for shadow fade
| `BottomNav` | Height 68px; icons 24px; label 12px | `default`, `active`, `hidden` (scroll down) | On mobile (≤768px) renders; uses safe-area padding `padding-bottom: env(safe-area-inset-bottom, 16px)` | `frontend-reactjs/apps/web/src/navigation/BottomNav.tsx`
| `Breadcrumb` | Auto width; separators 8px | `wrap`, `collapsed`, `overflow` | Collapses middle items to dropdown when >5 levels; supports keyboard navigation via roving tabindex | `@fixnado/ui/Breadcrumb`
| `CommandPalette` | Width 640px desktop, 100% mobile; height min 320px | `closed`, `opening`, `ready`, `executing` | Search across zones, bookings, providers; groups by type; arrow key navigation; `ctrl+k` opens | `frontend-reactjs/apps/web/src/components/CommandPalette`

## Feedback & Status Components
| Component | Dimensions | Styling | Behaviour | Asset |
| --- | --- | --- | --- | --- |
| `Toast` | 360×56px desktop; mobile 100% width minus 32px margins | Background `#111827`, radius 14px, shadow `0 24px 64px rgba(12,18,32,0.24)`; icon 20px left | Slides from top-right (desktop) or bottom (mobile); auto-dismiss 5s; manual close button 16px | `Toast` component under `@fixnado/ui/Toast`
| `Snackbar` | 420×72px | Left border 4px using severity colour; background tinted; text `Inter 14/22` | Sticky at top of content container; requires manual dismissal | n/a
| `ProgressStepper` | Horizontal: 100% width, height 88px; Step circles 48px diameter, connectors 4px thick | Completed step background `#1445E0`, icon check 16px; current step gradient border 2px; upcoming step `#CBD5F5` | Supports click navigation with confirmation guard; accessible with `aria-current="step"` | `frontend-reactjs/apps/web/src/components/Stepper`
| `StatusPill` | Height 28px, padding 0 12px, radius 14px | Colors map to tokens (see `Screen_update_Screen_colours.md`); text `Manrope 12/16` uppercase | Used across cards, tables; icons 14px left | `@fixnado/ui/StatusPill`
| `LoadingSkeleton` | Template-specific sizes; base height 16px bars, radius 12px | Gradient shimmer `linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.45), rgba(255,255,255,0))` animation 1.2s | Provide accessible text `aria-label="Loading"` and `aria-live="polite"` | `frontend-reactjs/apps/web/src/components/Skeleton`

## Data Visualisation Modules
| Component | Canvas | Colour/Assets | Interactions | Notes |
| --- | --- | --- | --- | --- |
| `ZoneHeatmap` | Map canvas 60% viewport width, height `calc(100vh - 72px)` | Mapbox style `fixnado-zones-web-v7` + local sprite `public/assets/maps/fixnado-sprite@2x.png` | Hover reveals tooltip card 280×160px; selection syncs with result list; `Shift+drag` for polygon selection | requires Mapbox token `MAPBOX_KEY_WEB`
| `TrendChart` | 12-column span, height 320px | ECharts theme `echarts-theme-fixnado.json` from `public/charts/` | Legend toggles, hover crosshair, keyboard nav via `tabindex=0` + arrow keys | Data from `analytics` GraphQL query
| `BarComparison` | Height 280px | Bars radius 8px; gradient fill per dataset | Bars clickable to drill down; `aria-roledescription="chart"` | n/a
| `GaugeCard` | 280×220px | Uses `react-svg-gauge` custom theme; pointer `#1445E0`, background `#E8EEFF` | Animates pointer over 480ms; optional threshold band `#E85A5A` | n/a
| `TableSummary` | 320×160px mini chart | sparkline using `recharts` with area gradient `#1445E0` 24% | Linked to table filters | n/a

## Interactive Utilities
- **`FilterDrawer`**: Right-hand drawer width 420px desktop, 360px tablet, 100% mobile. Contains segmented controls (height 44px), range sliders (track height 8px), checkboxes (20×20px). Drawer overlay `rgba(12,18,32,0.42)` blur 12px.
- **`DensityToggle`**: Icon toggle 44×44px controlling table/card density; states `comfortable`, `compact`, `condensed`. Saves selection to `localStorage('fixnado-density')`.
- **`UploadZone`**: Full width, 220px height; background `rgba(20,69,224,0.04)`, dashed border 2px `#1445E0`. Includes icon `icon-upload-cloud.svg` 64px centre and helper text `Inter 14/22`. Accepts drag drop, displays preview chips with remove icons 16px.
- **`AvatarGroup`**: Avatars 32px (desktop), 28px (mobile). Overlap -8px. Count overflow pill 32×32px background `rgba(15,23,42,0.16)` text `+5` `Manrope 12/16`.
- **`CommandPalette`**: Rendered via `ReactAria/Overlay`. Input field 56px height with icon 20px. Results grouped with heading `Inter 12/18` uppercase. Each item 48px height.

## Widget Source Mapping & Dependencies
| Widget | Source Repository / Package | Asset Path | Notes |
| --- | --- | --- | --- |
| Icons | `frontend-reactjs/packages/icons` | `src/svg/*.svg` | Use `pnpm icons:build` to regenerate React components; ensure stroke width 1.75px |
| Illustrations | `design/illustrations/web/v1.00` | `exports/web/*.svg` | Commits tagged `v1.00-web`. Provide fallback PNG at 2× resolution |
| Photography | `design/photography/operations` | `exports/web/hero/*.jpg` | All images in sRGB, compressed ≤220KB, alt text maintained in `assets-manifest.json` |
| Map Tiles | Mapbox style `fixnado-zones-web-v7` | n/a | Controlled via Mapbox account; update style in `Screens_update_images_and_vectors.md` |
| Motion | `assets/motion/web` | `*.json` Lottie files | Limit to <500KB; use `lottie-react@2` |

## Quality Gates
- Each component requires Storybook documentation linking back to this file section via comment `@spec component_types.md §...`.
- Visual regression snapshots captured at 1440, 1024, 768, 480 widths in Chromatic.
- Accessibility checklist per component: keyboard access, focus styling, screen reader labels, colour contrast (documented in `Stylings.md`).
