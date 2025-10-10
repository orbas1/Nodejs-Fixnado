# Page Design Strategy — Web Application v1.00

## Page Templates
- **Marketing Template**: Hero, feature grid, testimonials, CTA. Utilises `MarketingLayout` with minimal chrome.
- **Dashboard Template**: Sidebar + top bar, content grid with widgets, contextual filters.
- **Wizard Template**: Stepper header, progress tracker, form panels, persistent summary sidebar.
- **Modal/Overlay Template**: Centered container, dark scrim, close control top-right, focus trap.
- **Admin Template**: Sidebar, top admin banner (environment indicator), table-heavy layout with filters.

## Template Composition
- All templates derive from `BaseLayout` providing skip links, global notifications, theming toggles.
- Grid system consistent across templates (12 columns). Spacing tokens align to 8px scale.
- Use `PageHeader` component with breadcrumb, page title, actions. Variation per template (marketing uses center alignment, dashboards left align).

## Responsiveness
- Layout shift thresholds at 1440/1280/1024/768/480.
- On small screens, sidebar becomes drawer, tables convert to cards, stepper condenses to progress bar.
- Ensure hero sections maintain 320px min height on mobile to accommodate CTA.

## Content Density
- Aim for 60–70% viewport height for critical content before requiring scroll.
- Provide condensed variant for data-heavy pages (tables) with optional density toggle (comfortable/compact/condensed).
- Modals limited to 80% viewport height with internal scroll when overflow occurs.

## Accessibility & Compliance
- Each page defines ARIA landmarks: `header`, `nav`, `main`, `aside`, `footer`.
- Provide breadcrumb for deeper routes (≥2 levels). Screen readers announce page changes using `react-helmet` to update `<title>`.
- Guarantee 44px vertical spacing for interactive rows.

## Performance Targets
- Largest Contentful Paint < 2.5s on broadband, First Input Delay < 100ms.
- Use dynamic import for heavy modules (map, charts) to reduce initial bundle.
- Prefetch next likely routes based on user behaviour (Next.js `prefetch`).

## Content Authoring
- Maintain page-level documentation in Figma with named frames matching file names.
- Provide screenshot references stored in `/update_docs/1.00/ui-ux_updates/reference_images/` (create as needed).

## QA Checklist
- Validate responsive breakpoints in Chrome, Safari, Firefox, Edge.
- Run accessibility audit using Axe and keyboard navigation check.
- Validate copy against `text.md.md` guidelines.
