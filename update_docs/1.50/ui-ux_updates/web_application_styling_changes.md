# Web Application Styling Changes

## Design System Alignment
- Adopted Fixnado Polaris design tokens across web and panel experiences.
- 12-column responsive grid with 24px gutters, 64px margins on desktop, 16px on tablet.
- Introduced theme switcher (Light/Dark) ensuring brand consistency.

## Colour Palette
- **Primary:** Midnight Blue (#0B1F33) for headers, navigation.
- **Accent:** Teal (#1ABC9C) for interactive elements and highlights.
- **Secondary:** Magenta (#E84393) for ads and campaign cues.
- **Support:** Mist (#F5F6FA), Steel (#95A1B2), Obsidian (#121417).

## Typography
- Headers: IBM Plex Sans SemiBold (32/28/24px) with 120% line-height.
- Body: IBM Plex Sans Regular (16px) with 150% line-height.
- Data-heavy tables use IBM Plex Mono for numeric columns to preserve alignment.

## Component Updates
1. **Navigation**
   - Left rail icons adopt minimal line style; active state Teal bar indicator and bold label.
   - Top search field with pill shape, drop shadow, voice input icon.
2. **Cards & Tables**
   - Marketplace cards emphasise imagery with overlay gradient for legibility.
   - Tables support zebra striping, sticky header, inline status pills.
3. **Forms**
   - Multi-step wizards with progress bar at top, step label, and subtext.
   - Validation errors display inline with red text and icon, plus tooltip for resolution.
4. **Buttons**
   - Primary: Filled Teal (#1ABC9C) with white text, 6px radius.
   - Secondary: Ghost with Teal border, transitions to filled on hover.
   - Destructive: Magenta with emphasised shadow.
5. **Charts & Analytics**
   - Adopted brand palette for data series; accessible alternative textures for colour-blind mode.
   - Tooltip styling standardised with drop shadow and bold metrics.
6. **Modals & Panels**
   - Rounded corners (12px), drop shadow, close icon repositioned to top-right with accessible target size.

## Accessibility & Responsiveness
- Verified contrast compliance for both light/dark themes.
- Keyboard focus outlines use Teal glow; skip-to-content link accessible on top nav.
- Breakpoints: <768px collapses side rail into overlay drawer; cards stack vertically with CTA grouping.
