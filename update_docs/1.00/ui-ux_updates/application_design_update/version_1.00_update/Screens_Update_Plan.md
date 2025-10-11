# Phone Screen Delivery Plan — Version 1.00

## Sequencing Overview
Delivery is broken into five sprints (1 week each) with cross-functional checkpoints. Each sprint prioritises dependency-heavy layouts first to unblock engineering and asset production.

| Sprint | Screen Cluster | Dependencies | Definition of Ready |
| --- | --- | --- | --- |
| 1 | Authentication & Onboarding | Updated theming tokens, Lottie assets finalised | Copy deck approved, localisation placeholders inserted |
| 1 | Explore Home (baseline map) | Mapbox style `fixnado-zones-v10`, location services | Backend `/zones` endpoint contract signed off |
| 2 | Explore provider list & detail overlay | Provider card component, rating badge assets | Pricing schema validated |
| 2 | Booking wizard stepper | Calendar component, payment method API mocks | Payment provider connectors stubbed |
| 3 | Marketplace home & campaign detail | Promotional imagery, segmentation rules | Marketing supply data sample |
| 3 | Messaging list + chat | Websocket channel handshake, emoji asset pack | Notifications backend load-tested |
| 4 | Profile overview & settings detail | Preference API, document vault component | Legal copy approved |
| 4 | Compliance centre, document upload | File storage service, progress donut component | Storage SLA confirmed |
| 5 | Provider dashboard snapshot & bidding composer | Provider analytics API, quick action icons | Role-based access gating QA pass |
| 5 | Offline, error, success states | Global error taxonomy, offline data store | Strings finalised |

## Component Reuse Strategy
- **Cards**: Build `FixnadoElevatedCard`, `FixnadoListTile`, `FixnadoMetricCard` first; reused across Explore, Profile, Provider Dashboard.
- **Buttons**: Primary, Secondary, Ghost, Destructive, Icon defined in `Screen_buttons.md`. Implement as `FixnadoButton` with variants.
- **Chips & Pills**: Single `FixnadoPillChip` with size modifiers (sm, md) to avoid duplication.
- **Bottom Sheets**: Create `FixnadoModalSheet` template with handle, safe area management, scroll physics.

## Asset Production Timeline
| Asset Type | Owner | Due | Notes |
| --- | --- | --- | --- |
| Lottie Onboarding | Motion Design | Sprint 1 Day 3 | JSON exported to `assets/lottie/onboarding/` |
| Map Overlays | GIS | Sprint 1 Day 4 | Provide Mapbox style URL + offline PNG set |
| Provider Illustrations | Brand Design | Sprint 2 Day 2 | 5 hero images 1600×900, WebP & PNG |
| Iconography | Design Systems | Sprint 1 Day 2 | 48 icons in 24dp & 32dp artboards |
| Empty States | Illustration | Sprint 4 Day 1 | Provide vector (SVG) + PNG fallback |

## QA & Review Gates
1. **Design QA Checklists** — Each screen has acceptance checklist verifying spacing, tokens, and animation spec compliance.
2. **Accessibility Audit** — Run `flutter_accessibility_test` per sprint for new screens; log gaps in QA board.
3. **Performance Profiling** — Use Flutter DevTools to ensure frame build <16ms on Pixel 5 & iPhone 12 for each new cluster.
4. **Copy & Localisation** — After UI freeze, send strings to localisation; ensure dynamic length testing using pseudo locale.

## Engineering Hand-off Artifacts
- Annotated Figma frames with redlines, exported PDF (`/handoff/mobile/v1.00/phone_redlines.pdf`).
- JSON specification for theming tokens (mirrors `Colours.md` and `Fonts.md`), delivered via design tokens pipeline.
- Interaction prototypes recorded (MP4) demonstrating sheet transitions, map toggles, and success states.

## Risk & Mitigation
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Mapbox SDK integration delays | Blocks Explore cluster | Prepare static map fallback and skeleton states; implement caching stub |
| Payment provider compliance changes | Blocks booking wizard | Align weekly with compliance team, maintain configurable copy in remote config |
| Asset licensing approvals lag | Blocks onboarding and empty states | Use placeholder gradient backgrounds with text-only fallback |
| Performance regressions due to animations | Impacts older devices | Provide reduced-motion flag toggling via settings; ensure animations use `vsync` optimisations |

## Success Metrics
- 95% of components reused across screens (tracked by `FixnadoComponentUsage` analytics event).
- <5 visual QA issues per sprint post-handoff.
- NPS improvement target +6 for onboarding and booking flows after release.

## Capacity & Ownership Matrix
| Workstream | Design Owner | Engineering Lead | QA Lead | Notes |
| --- | --- | --- | --- | --- |
| Authentication & Onboarding | Lead UX (Amelia P.) | Mobile Squad A | QA Mobile 1 | Includes localisation + accessibility audit |
| Explore & Map | Principal Product Designer (Leo K.) | Mobile Squad B | QA Geo | Requires GIS coordination for tiles |
| Booking & Payments | Design Ops (Ravi S.) | Mobile Squad C | QA Payments | Stripe integration + compliance sign-off |
| Marketplace & Promotions | Growth Designer (Nia L.) | Mobile Squad D | QA Marketplace | Asset localisation & copy approvals |
| Messaging & Support | Communication Designer (Evan T.) | Mobile Squad A | QA Comms | Integrate AI-assist toggles |
| Profile, Settings, Compliance | Systems Designer (Mara G.) | Mobile Squad B | QA Compliance | Document vault security review |

## Handoff Rituals
- **Sprint Kickoff Workshops**: 60-minute session each Monday reviewing annotated wireframes, interaction prototypes, and outstanding decisions. Output logged in Confluence `Fixnado > Mobile v1.00`.
- **Mid-sprint Reviews**: Async Loom walkthrough (<10 min) per cluster summarising deviations, asset updates, and blockers.
- **Design QA Checklist**: Shared Notion template ensures verification of spacing, tokens, content, motion, accessibility, analytics instrumentation before marking "Ready for Dev".
- **Asset Drop**: Assets zipped per cluster (`/handoff/mobile/v1.00/{cluster}/assets.zip`) with manifest file referencing `Screens_update_images_and_vectors.md` rows.

## Dependencies & Tooling
- Figma libraries `Fixnado System / Mobile v1.00` locked week prior to implementation to avoid drift; updates go through change control board.
- Zeplin export maintained for stakeholders requiring measurement overlays; ensure tokens match Figma naming.
- Use Storybook for Flutter (`dashbook`) to validate component variations before integrating into screens.
- Token pipeline uses Style Dictionary; publish to `design-tokens/mobile/v1.00/*.json` nightly.

## Rollout & Feature Flagging Strategy
- Implement major clusters behind remote config flags: `feature.explore_v1`, `feature.booking_wizard_v1`, `feature.marketplace_v1`.
- Launch plan: Canary (5% users) week 1 post-dev, Beta (20%) week 2, GA week 4 after stability metrics met.
- Telemetry thresholds: crash-free sessions ≥99.3%, booking success rate +8% vs baseline, map screen average load time <2.8s.

## Post-Launch Monitoring
- Create Datadog dashboards tracking UI-specific metrics (frame render time, widget rebuild counts) leveraging Flutter integration.
- Run Hotjar-style session replay (via UXCam) for pilot cohort to validate interaction assumptions (map toggles, booking stepper drop-offs).
- Schedule design debt review after GA to capture backlog of enhancements identified during implementation.
