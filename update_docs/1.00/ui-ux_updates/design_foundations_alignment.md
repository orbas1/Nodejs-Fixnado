# Design Foundations Alignment — Version 1.00

This document captures the completed work for **Design Task 1 — Consolidate Design Foundations**. The audit covered every artefact in `ui-ux_updates/application_design_update/version_1.00_update` and `ui-ux_updates/web_application_design_update/version_1.00_update`, consolidating colours, typography, and spacing into a governed multi-platform token set. Accessibility validation, export automation, and cross-discipline rollout governance are documented below for engineering reference.

## 1. Token Inventory Summary

### 1.1 Colour Tokens
| Canonical Token | Hex | Mobile Alias (pre-update) | Web Alias (pre-update) | Primary Usage |
| --- | --- | --- | --- | --- |
| `fx.color.primary.500` | #1445E0 | `fixnado.primary.500` | `--fixnado-color-primary-500` | Primary CTAs, focused states, hero gradients |
| `fx.color.primary.600` | #0E33A8 | `fixnado.primary.600` | `--fixnado-color-primary-600` | Pressed/active CTA states, focus outlines on dark surfaces |
| `fx.color.secondary.500` | #00B894 | `fixnado.secondary.500` | `--fixnado-color-secondary-500` | Success feedback, positive KPI chips |
| `fx.color.secondary.600` | #009C7D | `fixnado.secondary.600` | `--fixnado-color-secondary-600` | Accessible text colour for success messaging |
| `fx.color.accent.warning` | #FFB020 | `fixnado.warning.500` | `--fixnado-color-accent-amber` | Pending bookings, at-risk compliance |
| `fx.color.accent.danger` | #E85A5A | `fixnado.danger.500` | `--fixnado-color-danger-500` | Destructive actions, failed SLAs |
| `fx.color.info.500` | #0EA5E9 | `fixnado.focus` | `--fixnado-color-info-500` | Informational alerts, focus rings |
| `fx.color.neutral.000` | #FFFFFF | `fixnado.surface.base` | `--fixnado-color-neutral-000` | Primary surface background |
| `fx.color.neutral.050` | #F5F7FB | `fixnado.neutral.050` | `--fixnado-color-neutral-050` | App shells, dashboard canvases |
| `fx.color.neutral.300` | #9CA3AF | `fixnado.neutral.300` | `--fixnado-color-neutral-300` | Dividers, disabled text |
| `fx.color.neutral.500` | #4B5563 | `fixnado.neutral.500` | `--fixnado-color-neutral-500` | Body text |
| `fx.color.neutral.700` | #1F2937 | `fixnado.neutral.700` | `--fixnado-color-neutral-700` | Secondary headings |
| `fx.color.neutral.900` | #0B1120 | `fixnado.neutral.900` | `--fixnado-color-neutral-900` | Display headings, dark mode backgrounds |
| `fx.color.dark.surface` | #0F172A | `fixnado.dark.surface` | `--fixnado-dark-surface` | Elevated dark mode panels, command palette |
| `fx.color.gradient.hero` | `linear-gradient(135deg,#0B1120 0%,#1445E0 55%,#0EA5E9 100%)` | `gradient.primary.hero` | `--fixnado-gradient-hero` | Landing hero overlays |
| `fx.color.gradient.analytics` | `linear-gradient(135deg,#1BBF92 0%,#0EA5E9 100%)` | `gradient.zone.legend` | `--fixnado-gradient-analytics` | Analytics tiles, surge overlays |

### 1.2 Typography Tokens
| Canonical Token | Typeface / Weight | Size / Line Height | Mobile Alias | Web Alias | Implementation Notes |
| --- | --- | --- | --- | --- | --- |
| `fx.type.display.lg` | Manrope / 700 | 30 / 40 | `display-lg` | `display-lg` | Use for onboarding hero copy; clamp to 40/52 on desktop |
| `fx.type.heading.xl` | Manrope / 600 | 26 / 34 (mobile) → 32 / 40 (web) | `title-lg` | `heading-xl` | Shared token ensures provider dashboards align across platforms |
| `fx.type.heading.md` | Manrope / 600 | 20 / 28 (mobile) → 24 / 32 (web) | `title-md` | `heading-md` | Section headers, card titles |
| `fx.type.body.md` | Inter / 400 | 15 / 22 (mobile) → 16 / 24 (web) | `body-md` | `body-md` | Primary body text |
| `fx.type.body.sm` | Inter / 400 | 14 / 20 | `body-sm` | `body-sm` | Captions, helper text |
| `fx.type.overline` | Inter / 600 | 12 / 16 | `micro` | `overline` | Badge labels, navigation rails |
| `fx.type.numeric.lg` | IBM Plex Mono / 500 | 24 / 28 (mobile) → 32 / 40 (web) | `numeric-lg` | `numeric-lg` | Dashboard KPIs (tabular nums enforced) |

### 1.3 Spacing Tokens
| Canonical Token | Pixel Value | Mobile Usage | Web Usage | Notes |
| --- | --- | --- | --- | --- |
| `fx.space.xxs` | 4px | Icon padding, chip inset | Border radii adjustments | New — replaces ad-hoc 4px margins |
| `fx.space.xs` | 8px | Default grid increment (`8dp`) | Column gutters ≤768px | Maps to Flutter `Spacing.xs` extension |
| `fx.space.sm` | 12px | Between label + input | Inline form spacing | Aligns with legacy 12px tokens in `Forms.md` |
| `fx.space.md` | 16px | Stack spacing in forms/cards | Default vertical rhythm | Replaces `Spacing.normal` references |
| `fx.space.lg` | 24px | Section padding, hero content | Desktop card gutters | Cascades to 24px grid documented in `Organisation_and_positions.md` |
| `fx.space.xl` | 32px | Modal padding, panel spacing | Dashboard widget gutters | Ties to `Screens_list.md` layout specs |
| `fx.space.2xl` | 48px | Hero vertical rhythm | Landing hero spacing | Provide responsive clamp for ≤600px viewports |
| `fx.space.3xl` | 64px | Page sections, marketing hero | Desktop banding | New — added for marketing surfaces referenced in `Home Page Organisations.md` |

## 2. Naming Convention & Deprecation Map
- Canonical pattern: ``fx.<category>.<sub-system>.<variant>`` (e.g., `fx.color.accent.warning`).
- Platform exports adopt idiomatic syntax while preserving canonical keys via metadata:
  - **CSS**: `:root { --fx-color-primary-500: #1445E0; }` with `data-token="fx.color.primary.500"` attributes for tooling.
  - **Flutter**: `FixnadoColors.primary500` with `@TokenKey('fx.color.primary.500')` annotations.
  - **TypeScript**: `export const FxColorPrimary500 = tokens['fx.color.primary.500'];`.

| Deprecated Token | Canonical Replacement | Migration Notes |
| --- | --- | --- |
| `fixnado.primary.500` (Flutter) | `fx.color.primary.500` | Replace references in theme files; lint rule forbids legacy namespace.
| `--fixnado-color-secondary-600` | `fx.color.secondary.600` | Update CSS variables and Storybook docs.
| `gradient.secondary.promo` | `fx.color.gradient.promo` | Aligns naming for marketing overlays.
| `display-xl` (web-specific) | `fx.type.display.xl` | Provide responsive clamp across breakpoints.
| `Spacing.normal`, `Spacing.large` | `fx.space.md`, `fx.space.lg` | Update design kits and layout tokens.
| Arbitrary 10px/14px paddings | `fx.space.sm`/`fx.space.md` | Normalise to 4px increment scale; remove bespoke tokens noted in `Stylings.md`.

All deprecated aliases remain available behind a compatibility export for one sprint. Engineering PR #DTS-1143 will remove them after adoption sign-off.

## 3. Accessibility Contrast Matrix
| Foreground Token | Background Token | Contrast Ratio | WCAG AA (Normal Text) | Action |
| --- | --- | --- | --- | --- |
| `fx.color.primary.500` | `fx.color.neutral.000` | 7.1:1 | ✅ | Meets AA/AAA. Default CTA text styling retained. |
| `fx.color.primary.500` | `fx.color.neutral.050` | 6.62:1 | ✅ | No change required; ensure hover state maintains ≥5.0. |
| `fx.color.neutral.900` | `fx.color.neutral.000` | 18.83:1 | ✅ | Reserve for large headings; lighten when using on `fx.color.neutral.900` backgrounds. |
| `fx.color.neutral.500` | `fx.color.neutral.000` | 7.56:1 | ✅ | Body copy approved; maintain 16px minimum. |
| `fx.color.neutral.000` | `fx.color.dark.surface` (#0F172A) | 17.85:1 | ✅ | Dark mode text contrast acceptable. |
| `fx.color.secondary.500` | `fx.color.neutral.000` | 2.54:1 | ❌ | Use `fx.color.secondary.700` (#009C7D) for text or apply on `fx.color.neutral.900` badges with white text. |
| `fx.color.accent.danger` | `fx.color.neutral.000` | 3.48:1 | ⚠️ | Increase tint background to 16% opacity with `fx.color.neutral.900` text for inline alerts. |
| `fx.color.info.500` | `fx.color.neutral.050` | 2.58:1 | ⚠️ | Pair with `fx.color.neutral.900` text; confine token to iconography and focus rings. |
| `fx.color.neutral.300` | `fx.color.dark.surface` | 7.03:1 | ✅ | Suitable for divider lines and disabled text in dark mode. |

Mitigations for non-compliant pairings are reflected in `Screens_Update.md` (mobile) and `Screens_Update.md` (web) with updated state annotations.

## 4. Token Export Automation
- **JSON Master Export**: `packages/design-tokens/dist/fx-tokens.v1.00.json` consolidates colour, typography, and spacing with canonical keys for integration tests.
- **CSS/SCSS**: `frontend-reactjs/src/styles/tokens/_fx-tokens.scss` autogenerates variables via `pnpm design:tokens`. Includes `@mixin fx-theme($mode)` to swap light/dark/emo palettes.
- **Flutter**: `flutter-phoneapp/lib/theme/fx_tokens.dart` exposes `FixnadoTokens` classes wrapping `ColorScheme`, `TextTheme`, and spacing constants.
- **Design Tooling**: Figma tokens plugin is synchronised via workspace library `Fixnado Design System / Foundations v1.00`. Sync job `figma-sync.yml` runs nightly.
- **Governance**: Added lint rule `no-legacy-token` to shared ESLint/TSLint configs and Flutter `build_runner` to flag deprecated identifiers during CI.

## 5. Cross-Discipline Review & Adoption Plan
- **Review Session**: Held 2025-01-28 with representatives from Product, Frontend, Flutter, QA, Marketing, and Compliance.
- **Decisions**:
  - Freeze canonical token list in Git-managed JSON; all future additions require design council approval with ticket ID.
  - Adopt weekly delta report comparing Figma tokens vs repository exports to prevent drift.
  - Enforce contrast mitigation rules above in QA checklists and include automated Pa11y tests targeting new colour combinations.
- **Adoption Timeline**:
  - Sprint 3: Update React theme + Storybook (owner: Frontend Tech Lead).
  - Sprint 3: Integrate Flutter token classes and remove legacy enums (owner: Mobile Tech Lead).
  - Sprint 4: Deprecate compatibility exports; run regression tests across apps.
- **Support Artefacts**: Shared Loom walkthrough (`design-foundations-sync-2025-01-28.mp4`) and Confluence page link recorded in `Design_update_task_list.md`.

## 6. Outstanding Follow-ups
- Validate emo palette contrast adjustments once marketing assets deliver new gradients (due Sprint 4).
- Extend token linting to infrastructure IaC templates for colour-coded dashboards.
- Monitor analytics on CTA engagement post-rollout to confirm no regression from contrast tweaks.
