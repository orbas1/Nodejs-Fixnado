# Home Page Imagery Plan — Web Application v1.00

## Hero Imagery
- **Asset**: `hero-map@2x.jpg` (Mapbox render with zone overlays).
- **Dimensions**: 2880×1200px (for retina), served at 1440×600.
- **Source**: Generated via Mapbox Studio style `fixnado-zones-web-v7`, exported to `frontend-reactjs/public/assets/hero/`.
- **Overlay**: Apply gradient overlay `rgba(11,17,32,0.7) → rgba(20,69,224,0.3)` to preserve text contrast.

## Zone Cards
- **Asset Type**: Static PNG map snippets.
- **Dimensions**: 480×320px (desktop), 360×240px (tablet), 320×200px (mobile).
- **Source**: Batch exported from Figma component `Zone Snapshot` referencing Mapbox snapshots.
- **Treatment**: Rounded corners 16px, drop shadow level 1.

## Marketplace Cards
- **Photography**: Represent service scenarios (logistics teams, infrastructure repairs).
- **Source Repository**: `assets/photography/operations/` (internal license). File naming `operations-logistics-team-01.jpg` etc.
- **Dimensions**: 1280×960px (cropped to 4:3). Display at 280×200 with CSS `object-fit: cover`.
- **Colour Grading**: Apply overlay `rgba(20,69,224,0.25)` for brand consistency.

## Testimonials
- **Portraits**: 160×160px exports, displayed at 80×80px.
- **Source**: `assets/people/partners/` with alt text `"Portrait of [Name], [Role]"`.
- **Backdrop**: Circular mask with subtle border `2px solid rgba(255,255,255,0.5)`.

## Logos
- **Partners**: Vector SVG `assets/logos/partners/*.svg` sized 120×60px.
- **Handling**: Use `mask-image` for monochrome variant, fill `#FFFFFF` for hero overlay, `#0B1120` for light backgrounds.

## Knowledge Hub Illustrations
- **Illustrations**: Lottie animations `insight-orbit.json` fallback PNG `insight-orbit.png`.
- **Dimensions**: 420×280px.
- **Source**: `design/illustrations/web/v1.00` commit `a4f7d1c`.

## Performance Considerations
- Serve hero image via responsive `srcset` (768w, 1440w, 2880w). Use `loading="lazy"` for sub-sections.
- Compress JPEGs to <220KB using `mozjpeg` pipeline; WebP alternative served via `picture` element.
- Preload hero background for Largest Contentful Paint target (<2.5s).

## Accessibility
- Provide descriptive `alt` text focusing on meaning ("Map highlighting priority logistics zones" rather than generic).
- Ensure decorative graphics (`background blobs`) use `role="presentation"` or CSS backgrounds.
- Maintain 4.5:1 contrast between imagery overlays and text; adjust brightness if necessary.
