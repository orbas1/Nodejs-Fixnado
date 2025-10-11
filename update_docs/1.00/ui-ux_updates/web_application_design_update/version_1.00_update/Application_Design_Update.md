# Web Application Design Update — Version 1.00

## Executive Summary
Version 1.00 codifies a full enterprise-grade visual and interaction language for the Fixnado web control centre. The redesign treats the public explorer, authenticated portals, and administrative consoles as one continuous system with harmonised navigation, modular components, and configurable theming. All deliverables in this folder specify exact measurements, behaviour, and asset sourcing so engineering and content teams can implement without ambiguity.

## Objectives
1. **Define pixel-perfect responsive breakpoints** at 1440×900, 1280×800, 1024×768, 768×1024, 480×812, and 360×780 with a fluid grid (`minmax(72px, 1fr)` columns, 24px gutter desktop, 20px tablet, 16px mobile) and explicit safe-area padding for notch devices (env(safe-area-inset-bottom) + 16px).
2. **Standardise interaction primitives** covering map explorers, analytics dashboards, booking funnels, and compliance tools through reusable tokens, behaviours, and telemetry hooks.
3. **Document asset provenance** (repository path, license, version tags) for photography, illustrations, map tiles, icons, and motion to ensure reproducibility and audit readiness.
4. **Prescribe accessibility-first patterns** that satisfy WCAG 2.2 AA, including keyboard flows, high contrast modes, reduced motion alternatives, and large text scaling tolerance (up to 200%).
5. **Outline implementation sequencing** aligning React squads, API contracts, and content strategy so release trains can parallelise without design drift.

## Experience Pillars
- **Command-Centred Layouts**: Left-aligned navigation with context-aware sub-headers and collapsible side panels keep map and data canvases dominant. 64px high header ensures consistent telemetry, search, and status indicators.
- **Geo-Zonal Intelligence**: Map surfaces combine 60% viewport width canvases, 40% split panels, and detail drawers 420px wide. Tooltip specs, legend tokens, and polygon styling documented in `Colours.md` and `Screens_update_images_and_vectors.md`.
- **Marketplace Monetisation**: Banner heights (320px), card grids (4×280px columns desktop), and upsell placements (sticky 96px high footer on checkout) align with marketing KPIs.
- **Compliance Confidence**: Stepper modules, document vault cards, and risk badges adopt consistent iconography and messaging from `Screen_text.md` and `Profile Styling.md`.

## Page Template Framework
| Template | Column Layout | Primary Components | Notes |
| --- | --- | --- | --- |
| `ExplorerShell` | 60/40 split grid | `MapCanvas`, `ResultPanel`, `FilterDrawer` | Map uses Mapbox style `fixnado-zones-web-v7@commit:6f2a8`. Drawer width 360px.
| `DashboardShell` | 12-column grid (max-width 1368px) | `KpiRow`, `ChartStack`, `ActivityStream` | Cards span multiples of 3 columns. Uses `@fixnado/ui/Grid` primitives.
| `WorkflowShell` | 8/4 columns | `Stepper`, `FormSections`, `SummarySidebar` | Stepper 72px height; summary locked to top using `position: sticky` offset 96px.
| `AdminShell` | 264px sidebar + flexible content | `DataTable`, `DetailDrawer`, `CommandBar` | Sidebar collapses to 88px icon rail; command bar 56px high.

## Component System & Tokens
- Token names follow `fixnado-{category}-{scale}` (e.g., `fixnado-color-primary-500`). Token definitions in `Colours.md`, `Fonts.md`, `Stylings.md`.
- Components enumerated in `component_types.md` and behaviours in `component_functions.md`; each entry references the owning squad (`web-explorer`, `web-marketplace`, `web-admin`).
- Motion tokens defined as `motion.fast = 160ms`, `motion.medium = 240ms`, `motion.slow = 320ms` with easing curves specified in `Stylings.md`.

## Asset & Resource Mapping
| Asset Type | Source Repo / Folder | Version Tag | Notes |
| --- | --- | --- | --- |
| Photography | `design/asset-pipeline/web/photography` | `v1.00.0` | Includes hero map composites, operational imagery. Export to `frontend-reactjs/apps/web/public/assets/hero/`.
| Illustrations | `design/asset-pipeline/web/illustrations` | `v1.00.0` | SVG + Lottie with JSON metadata. Referenced in `Screens_update_images_and_vectors.md`.
| Iconography | `frontend-reactjs/packages/icons` | `@fixnado/icons@1.8.0` | 24px grid, 1.75px stroke, tree-shakeable React components.
| Map Tiles | Mapbox Studio style `fixnado-zones-web-v7` | Style version `2024-05-17` | Bound to API key `mapbox://styles/fixnado/ckzv3l7qk001014nqcvb45u1k`.
| Fonts | Adobe Fonts kit `KVN7YJC` (Manrope, Inter, IBM Plex Mono) | Synced nightly | Self-hosted fallback `.woff2` in `public/fonts/`.

## Implementation Roadmap
1. **Token Export & Theming** (Week 1)
   - Publish tokens to `packages/design-tokens@1.0.0`.
   - Update `frontend-reactjs/apps/web/src/theme.ts` to import new tokens and expose CSS custom properties.
2. **Navigation & Layout Foundation** (Weeks 1–2)
   - Ship `ExplorerShell`, `DashboardShell`, `WorkflowShell`, `AdminShell` wrappers with responsive breakpoints and skeleton states.
   - Implement sticky header + command bar behaviours.
3. **Component Library Enhancements** (Weeks 2–4)
   - Extend `@fixnado/ui` with `SidePanel`, `CommandPalette`, `DensityToggle`, `GeoLegend`, `CampaignCard` components following specs.
   - Build Storybook stories demonstrating all states (default, hover, focus, disabled, loading, error, empty) for each component.
4. **Data Wiring & State Management** (Weeks 3–5)
   - Integrate GraphQL hooks via `@fixnado/data` with SWR caching; ensure stale-while-revalidate patterns for map and bookings.
   - Implement websocket clients for chat and alerts; fallback to polling where SSE unavailable.
5. **Accessibility & QA** (Weeks 5–6)
   - Axe audits, manual screen reader passes (NVDA, VoiceOver), keyboard testing for modals/drawers.
   - Performance baseline: Largest Contentful Paint < 2.7s on 4G, Interactivity < 100ms for primary CTAs.

## Governance & Collaboration
- Weekly cross-functional design review (Thursday 14:00 UTC) to validate component changes before merging.
- All modifications tracked in `design_change_log.md` referencing Jira epics (`WEB-430`, `WEB-441`, `WEB-452`).
- Engineers must attach screenshots to pull requests referencing spec line numbers (e.g., `Screens_Update.md §2.3`).
- QA uses `Dummy_Data_Requirements.md` to seed staging environments ensuring UI parity during validation.

## Acceptance Criteria
- **Visual Fidelity**: Implementation matches Figma frames within ±2px for critical components, ±4px for fluid layouts. Use `chromatic` snapshots for visual regression.
- **Behavioural Compliance**: All flows follow `Logic_Flow_update.md` and `Logic_Flow_map.md` without missing steps or unsupported transitions.
- **Performance**: Map render under 900ms after filter change, table pagination fetch under 600ms, chat connection handshake under 1.5s.
- **Accessibility**: Each interactive component has keyboard equivalence, meets contrast, supports reduced motion, and includes descriptive ARIA labels.
- **Documentation Traceability**: Each deployed screen references spec files via README block in component folder to maintain long-term maintainability.

## Next Steps
- Lock design tokens in Figma and export to repository by 2024-06-15.
- Coordinate with infrastructure to cache Mapbox tiles in edge nodes for latency reduction.
- Prepare marketing copy variations (EN, FR, ES) to test translation expansion using `text.md.md` references.
- Schedule provider advisory board session to validate dashboard layout (target 2024-06-20).
