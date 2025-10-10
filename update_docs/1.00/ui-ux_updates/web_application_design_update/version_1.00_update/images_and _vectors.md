# Images & Vector Asset Guidelines — Web Application v1.00

## Asset Types
- **Photography (JPG/WEBP)**: Hero imagery, marketplace visuals.
- **Illustrations (SVG/Lottie)**: Empty states, onboarding, analytics overlays.
- **Icons (SVG)**: UI controls, status indicators.
- **Maps (PNG/SVG)**: Static map snapshots, zone overlays.

## Resolution Standards
- Photography exported at 2× resolution (min 1440px width), compressed to <250KB.
- Vector illustrations exported as SVG with `viewBox` defined, fallback PNG 2× for legacy.
- Icon grid 24px with 2px padding; maintain consistent stroke weight 1.75px.

## Colour Management
- Use design tokens for fill/stroke: primary `#1445E0`, secondary `#00B894`, neutral `#4B5563`.
- Provide dark mode variants for icons by referencing CSS variable `currentColor`.

## Storage & Naming
- Store assets in `frontend-reactjs/public/assets/` with subfolders `hero`, `zones`, `packages`, `illustrations`.
- Naming convention: `category-context-size@2x.ext` (e.g., `hero-map-coverage@2x.jpg`).
- Include metadata JSON with attribution, license, alt text suggestions.

## Optimisation
- Use `svgo` with config preserving IDs for animated segments.
- For Lottie, keep frame rate ≤ 30fps, file size < 500KB.
- Implement responsive images with `<picture>` to serve WebP first, fallback to JPEG/PNG.

## Accessibility
- Provide descriptive alt text for meaningful images; mark decorative vectors with `role="presentation"`.
- Ensure icons used for status include textual label or tooltip.

## Delivery Pipeline
- Assets versioned in Git; pipeline runs `pnpm assets:optimize` to compress before deployment.
- CDN caching with long TTL; bust cache via query string `?v=1.00`.

## Licensing & Compliance
- All imagery sourced from internal shoots or licensed via enterprise Getty account; track license expiry in Notion.
- Illustrations custom designed under Fixnado brand guidelines.
