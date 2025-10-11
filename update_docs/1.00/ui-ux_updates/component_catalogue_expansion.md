# Component & Widget Catalogue Expansion — Task DT3

## 1. Audit Summary
- Consolidated 24 button, card, and status variants across web artefacts into five canonical web button variants (`primary`, `secondary`, `tertiary`, `ghost`, `danger`) mapped to tokenised states and analytics hooks.
- Deprecated four redundant card shells and merged insights widgets into a shared `fx-card` primitive with padding tokens (`sm`, `md`, `lg`) aligned to the 8px spacing scale.
- Catalogued data visualisation widgets (trend, comparison, gauge) ensuring every module references refreshed palette tokens, motion curves, and accessibility guardrails documented in `component_types.md`.
- Normalised form primitives (text input, checkbox, segmented control) with inline validation semantics and prefix/suffix affordances for compliance data capture.

## 2. Production-Ready Components
| Component | Implementation | Key Behaviours | Analytics & Compliance Hooks |
| --- | --- | --- | --- |
| `Button` | `frontend-reactjs/src/components/ui/Button.jsx` | Variants + states (default, hover, active, focus ring, disabled, loading); supports `to`/`href`, icon placement, and analytics IDs. | Emits `data-action` attribute for telemetry; blocks navigation when disabled. |
| `Card` | `frontend-reactjs/src/components/ui/Card.jsx` | Shared elevation, padding scale, interactive lift state. | Semantic wrapper defaults to `<article>` for screen-reader grouping. |
| `StatusPill` | `frontend-reactjs/src/components/ui/StatusPill.jsx` | Tone-aware badges for compliance/security statuses. | Provides `role="status"` to surface updates to assistive tech. |
| `TextInput` | `frontend-reactjs/src/components/ui/TextInput.jsx` | Inline hint/error, prefix/suffix adornments, auto ID generation. | ARIA wiring for hint/error; ensures focus ring and validation copy satisfy WCAG 2.2. |
| `SegmentedControl` | `frontend-reactjs/src/components/ui/SegmentedControl.jsx` | Keyboard accessible radiogroup for density/timeframe toggles. | Uses `aria-checked` and roving tabindex for automated QA checks. |
| `Skeleton` | `frontend-reactjs/src/components/ui/Skeleton.jsx` | Gradient shimmer respecting `prefers-reduced-motion`. | Provides `aria-hidden` to avoid announcement noise. |

## 3. Analytics & Data Widgets
| Widget | Implementation | Visual & Motion Alignment | Data Hooks |
| --- | --- | --- | --- |
| `AnalyticsWidget` | `frontend-reactjs/src/components/widgets/AnalyticsWidget.jsx` | Shared header/badge/footer, Framer Motion entrance (220ms ease-out). | Accepts actions array hooking into button analytics IDs. |
| `TrendChart` | `frontend-reactjs/src/components/widgets/TrendChart.jsx` | Gradient area chart, target overlays, accessible tooltip. Uses Recharts with CSS token colours. | Supports target reference lines and tooltip instrumentation for KPI tracking. |
| `ComparisonBarChart` | `frontend-reactjs/src/components/widgets/ComparisonBarChart.jsx` | Dual-series bars with contrast-compliant palette and shared tooltip component. | Surfaces resolved vs escalated counts for dispute reporting. |
| `GaugeWidget` | `frontend-reactjs/src/components/widgets/GaugeWidget.jsx` | Semi-circular radial chart, SLA badge, tokenised colours. | Drives SLA status pill and ensures max/target values align with governance thresholds. |
| `MetricTile` | `frontend-reactjs/src/components/widgets/MetricTile.jsx` | Gradient tile, typography scale, status pill integration. | Accepts `deltaTone` for success/warning/negative instrumentation. |

## 4. Regression Checklist
1. **Visual Regression** — Add Chromatic snapshots at 1440/1024/768/480 for all new components and widget states. Reference `fx-btn`, `fx-card`, and chart components with tokens in screenshot metadata.
2. **Accessibility** — Validate keyboard flows for segmented controls, ensure button focus rings meet 3:1 contrast, run axe + manual screen-reader review on Admin dashboard integration.
3. **Internationalisation** — Verify layout resilience with long-form localisation strings (Spanish, Arabic) inside `MetricTile`, `StatusPill`, and chart tooltips.
4. **Performance** — Ensure Recharts bundle splitting remains under 35kb gzipped, run Lighthouse to confirm dashboard LCP <2.7s after widget loading.
5. **Observability** — Map `data-action` IDs (`download_audit_pack`, `export_metrics`, `view_queue_*`) into analytics schema and QA event capture in staging.

## 5. Handoff Notes
- Token definitions consolidated in `src/styles.css`; UI CSS under `components/ui/ui.css` contains spec-aligned class names for implementation reference.
- Admin dashboard updated (`frontend-reactjs/src/pages/AdminDashboard.jsx`) to exercise new components with realistic data (escrow trends, SLA gauge, compliance backlog). Provides engineering-ready example wiring.
- Dependencies added: `framer-motion@12.8.3` and `recharts@2.12.7` documented in `package.json` for data visualisation and motion behaviours.
- QA teams should extend Playwright journeys to cover timeframe toggles, CSV export stub, and compliance card navigation; align with `Design_update_progress_tracker.md` metrics for motion & render grades.
