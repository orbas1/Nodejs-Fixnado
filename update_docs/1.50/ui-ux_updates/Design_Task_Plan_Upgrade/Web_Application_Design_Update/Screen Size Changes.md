# Screen Size Adaptation Plan

## Breakpoint Summary
- Desktop Large ≥1440px – full layout with sidebars.
- Desktop Standard 1280–1439px – maintain two-column layout.
- Tablet Landscape 1024–1279px – compress gutters, stack sidebar below main content.
- Tablet Portrait 768–1023px – single column with collapsible sections.
- Mobile 480–767px – stacked layout, condensed navigation, simplified charts.
- Mobile Small <480px – hide non-critical imagery, focus on core actions.

## Responsive Adjustments
- Navigation collapses to hamburger at ≤1024px; command palette accessible via button.
- Tables convert to card view on mobile with horizontal scroll for numeric data.
- Charts simplify to sparklines or key figures on mobile to maintain clarity.

## Testing
- Validate layouts on Chrome, Firefox, Safari, Edge for each breakpoint.
- Use BrowserStack to test IE11 fallback (static marketing pages only) with simplified styles.
