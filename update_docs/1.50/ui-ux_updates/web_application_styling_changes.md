# Web Application Styling Changes (v1.50)

## Design Token Alignment
- Established unified token system for colours, spacing, typography, elevation, and motion shared across marketing and product experiences.
- Introduced semantic naming (e.g., `color.background.surface`, `space.xl`, `font.heading.lg`) enabling theme overrides per tenant in future roadmap.
- Tokens exported to CSS variables and Figma libraries to maintain parity between design artifacts and implementation.

## Colour & Imagery
- Primary palette: **Navy 700 (#1A237E)**, **Sky 400 (#42A5F5)**, **Teal 400 (#26C6DA)**, and **Amber 400 (#FFCA28)** for highlights; neutrals defined from Gray 25 to Gray 950 with 12 stops.
- Dark mode variant emphasises muted blues and teals with higher contrast text while keeping accent amber for alerts; ensures WCAG AA.
- Hero imagery updated to industrial photography with overlay gradient for readability; background patterns use subtle geometric grid.

## Typography & Layout
- Heading font: **Manrope** 600/700; body font: **Inter** 400/500; monospace for code blocks: **JetBrains Mono** 500.
- Responsive scale: `xs 12`, `sm 14`, `md 16`, `lg 18`, `xl 20`, `2xl 24`, `3xl 32`, `4xl 40`; line heights tuned per context (e.g., `md` 24px for tables).
- Layout grid uses 12 columns with 24px gutters on desktop, 8 columns with 16px gutters on tablet; cards maintain 24px interior padding and 32px top spacing between sections.

## Components
- Buttons: solid primary with 4px corner radius, 1.5px border in dark mode, hover lighten by 6%, focus ring 3px `Sky 300`; secondary uses outline; tertiary is ghost with hover background.
- Tables: zebra striping introduced for readability, column headers sticky with drop shadow; row interactions provide inline edit icons on hover.
- Modals: 32px radius, drop shadow `0 24px 48px rgba(15,27,67,0.24)`; header includes icon for context, footer uses stacked actions on mobile.
- Tabs & pills: emphasise active state with underline and background tint; accessible arrow key navigation added.
- Live feed header adopts a status pill with animated glow when connected, amber pulse when reconnecting, and slate outline when paused; timestamp labels use `Inter 12/16` with grey-600 colour tokens and switch to warning red when staleness exceeds 90 seconds.

## Interaction & Motion
- Standard animation curve `cubic-bezier(0.4, 0.0, 0.2, 1)` for transitions; durations: 150ms (micro), 250ms (modal), 350ms (page).
- Loading skeletons defined for cards, tables, and charts; use gradient shimmer to indicate progress without jarring motion.
- Notification toasts appear top-right, stacking with max 3 visible; each includes icon, descriptive text, and action link.
- SSE reconnect spinner uses 180ms fade-in/out with easing `cubic-bezier(0.33, 1, 0.68, 1)` to avoid stutter during repeated retries; offline cache banner slides down with 220ms duration and retains focus trap for screen reader visibility.

## Accessibility & Internationalisation
- Form fields meet minimum 48px height, focus outlines accessible on all backgrounds, error messaging includes icon + actionable text.
- RTL support improved by mirroring layout grid, adjusting icons that imply direction, and ensuring text alignment flips gracefully.
- Language selector style ensures long locale names truncate with tooltip fallback.
- Status pill copy is mirrored in `aria-live` announcements and includes icon-only alternative text for screen readers, ensuring live feed users receive parity feedback when colour perception is limited.

## Compliance Operations Console
- Warehouse export dashboard uses split panels with dark-surface cards and neon-accent chips to distinguish export health from GDPR request widgets while remaining within the shared token system.
- Manual trigger drawer includes caution banner styling (Amber 400 background, Navy 700 text) outlining DPIA prerequisites before operators launch exports.
- Audit timeline uses stacked badges with subtle glow to highlight active runs; completed runs display download pills with gradient outlines and embedded iconography for quick recognition.
- GDPR metrics header introduces four KPI tiles (total requests, overdue, average completion, completion rate) leveraging gradient backgrounds (Primary/Warning/Success/Info) with 24px corner radius and 20px type scale; refresh button adopts ghost style with primary hover accent.
- Data request table now reserves 180px column for `Due at` with badge colours: emerald for on track, amber for due soon, rose for overdue; tooltips include SLA copy and timezone conversions.
- Finance alert ribbons adopt severity palettes (Critical `#D32F2F`, High `#F57C00`, Medium `#FBC02D`, Informational `#0288D1`) with 18px pill badges indicating Slack/Opsgenie delivery state and retry counters rendered in JetBrains Mono for clarity.
- Escalation drawers use stacked section headers with 16px divider spacing, responder avatar chips, and a neutral slate background so long-form remediation steps remain legible alongside telemetry pills.
- Retry countdown timers animate via subtle progress bars (4px height) that inherit severity colour and reset smoothly when acknowledgements pause repeats, preventing jarring flashes during extended monitoring sessions.
- Creation studio wizard gains responsive grid, persona badge styling, autosave toast colours, and publish confirmation cards to mirror the new engineering implementation.
