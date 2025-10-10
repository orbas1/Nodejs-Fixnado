# Phone Application Design Update — Version 1.00

## Executive Summary
Version 1.00 of the Fixnado phone application rethinks the end-to-end provider and user experience around the geo-zonal service marketplace. The redesign translates the unified design system documented in the global change log into highly prescriptive screen, interaction, and data specifications for Flutter delivery teams. Every screen element is plotted on the 8px spacing grid, colour tokens are mapped to semantic use cases, and widget behaviours are documented so that engineers, QA, and content strategists can implement the experience without additional discovery.

## Objectives
- Deliver enterprise-grade clarity for the new zonal intelligence and marketplace monetisation initiatives.
- Guarantee accessibility (WCAG 2.1 AA) and performance (target <100ms frame build) by defining responsive breakpoints, touch targets, and animation specs.
- Provide asset sourcing direction (illustrations, icons, Lottie motion) with licensing guidance and repository references.
- Align provider and user flows with compliance, billing, and advertising feature sets introduced in v1.00 backend APIs.

## Artefact Map
| Document | Purpose | Key Consumers |
| --- | --- | --- |
| `Screens_Update.md` | Visual catalogue of every phone screen with dimensions and layout diagrams. | Flutter engineers, QA |
| `Screens_Update_Plan.md` | Delivery sequencing, dependencies, and reusable components per screen cluster. | Product, PMO |
| `Screens_Update_Logic_Flow.md` & `Logic_Flow_update.md` | Task flows, state transitions, API touchpoints. | Engineering, QA |
| `Screen_update_Screen_colours.md` & `Colours.md` | Colour tokens, gradients, semantic mapping. | Design system, engineers |
| `Screen_buttons.md`, `Screens__Update_widget_types.md`, `Screens_Updates_widget_functions.md` | Widget taxonomy and behavioural specs. | Flutter component team |
| `Fonts.md`, `Screen_text.md` | Typographic hierarchy, copy deck scaffolding. | UX writing |
| `Organisation_and_positions.md`, `Forms.md`, `Cards.md` | Spatial rules, component states. | Engineers, QA |
| `Dummy_Data_Requirements.md`, `Menus.md`, `Settings*.md` | Data seeding and configuration blueprint. | QA, data engineering |

## Implementation Approach
1. **Component Library Update (Week 1-2)** — Expand shared Flutter component library with new cards, chips, FAB, and navigation components defined herein. Validate with storybook-style showcase.
2. **Screen Production (Week 2-5)** — Follow `Screens_Update_Plan.md` order. Each screen produced using Figma auto-layout guidelines converted to Flutter `LayoutBuilder`/`Flex` patterns. Ensure each layout meets <2 builds per frame using `const` constructors where possible.
3. **Theming Integration (Week 2)** — Introduce theme extension using `ThemeData` with colour tokens from `Colours.md` and type styles from `Fonts.md`. Provide `ThemeMode` switch support even if not exposed yet for accessibility testing.
4. **Data Wiring (Week 4-6)** — Bind to backend endpoints enumerated in logic flow docs. Use Riverpod for state management; define providers and caching intervals according to flow charts.
5. **QA & UAT (Week 6-7)** — Validate using dummy data sets, run accessibility audits with `flutter_accessibility_test` plugin, and performance traces on iOS/Android reference devices.

## Dependencies & Assets
- **Iconography** sourced from Fixnado internal Figma library `fixnado-system/v1.00/icons`, exported as SVG for Flutter `flutter_svg` package.
- **Illustrations**: Lottie animations from `assets/lottie/onboarding/` referencing repository `design-system/lottie@v1.2`. Provide JSON names in `Screens_update_images_and_vectors.md`.
- **Maps & Zones**: Use Mapbox SDK with custom style `fixnado-zones-v10`. Raster fallback stored in `assets/maps/` for offline mode.

## Acceptance Criteria
- No visual drift greater than ±2px when compared to reference specs at 360×780dp viewport.
- All interactive components include tactile feedback (`HapticFeedback.mediumImpact` or ripple) and voice-over labels.
- Theming tokens referenced via `Theme.of(context).extension<FixnadoTheme>()` rather than hard-coded colours.
- Lottie files load within <120ms on Pixel 5 baseline.

## Next Steps
- Review sessions with engineering and QA to walk through each document.
- Schedule design QA checkpoints at the end of each sprint milestone in `Screens_Update_Plan.md`.
- Update shared Figma file `Fixnado-Mobile-v1.00.fig` to match textual specs for traceability.
