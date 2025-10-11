# Version 1.00 Update Change Log

## 2025-01-28 — Design Foundations Consolidation
- Delivered cross-platform token alignment covering colours, typography, and spacing with canonical `fx.*` namespace and accessibility mitigation guidance. See `ui-ux_updates/design_foundations_alignment.md` for full inventory and adoption plan.
- Automated JSON, SCSS, and Flutter token exports to ensure engineering parity; linting rules prevent legacy token usage in CI.
- Captured cross-discipline review outcomes (Product, Frontend, Flutter, QA, Marketing, Compliance) and scheduled Sprint 3/4 adoption checkpoints.

## 2025-01-29 — Core Page Blueprint Recomposition
- Implemented recomposed home, admin dashboard, provider profile, and services marketing layouts in the React codebase (`frontend-reactjs/src/pages`). Navigation updated to persona-led clusters with breadcrumb strategy and compliance overlays.
- Introduced shared blueprint primitives (`components/blueprints/PageHeader.jsx`, `BlueprintSection.jsx`) to enforce grid, accessibility, and instrumentation patterns across pages.
- Published `ui-ux_updates/core_page_blueprints.md` documenting IA decisions, compliance guardrails, localisation rollout status, and next actions for motion/Storybook coverage.
