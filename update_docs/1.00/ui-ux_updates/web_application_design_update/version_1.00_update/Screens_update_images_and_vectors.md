# Image & Vector Assets — Web Application v1.00

> This guide specifies every raster, vector, and motion asset required by the v1.00 web experience, including repository paths, resolutions, and licensing notes. All assets must be catalogued in `assets-manifest.json` with checksums generated via `pnpm assets:checksum`.

## Asset Repositories
| Type | Location | Version Tag | Notes |
| --- | --- | --- | --- |
| Photography | `design/photography/web/v1.00` | `photo-pack-2024.05` | RAW → edited JPEG/WEBP. Exported to `frontend-reactjs/apps/web/public/assets/hero/` |
| Illustrations | `design/illustrations/web/v1.00` | `illus-pack-2024.05` | SVG + Lottie, stored in `public/assets/illustrations/` |
| Icons | `frontend-reactjs/packages/icons` | `@fixnado/icons@1.8.0` | Source SVG grid 24px. Build script generates React components |
| Map Overlays | Mapbox Studio `fixnado-zones-web-v7` | Style version `2024-05-17` | Export static PNG fallback to `public/assets/maps/` |
| Motion | `assets/motion/web` | `motion-pack-2024.05` | Lottie JSON with fallback PNG frames |

## Landing & Explorer Assets
| Asset ID | File | Dimensions | Format | Usage | Licensing |
| --- | --- | --- | --- | --- | --- |
| `hero-city-grid` | `public/assets/hero/hero-city-grid@2x.jpg` | 2880×1200 | JPG + WebP | Landing hero background | Internal capture — unlimited |
| `hero-city-grid-overlay` | CSS gradient `--fixnado-gradient-hero` | n/a | CSS | Applied via pseudo-element overlay | n/a |
| `hero-statistics` | `public/assets/illustrations/hero-statistics.svg` | 960×480 | SVG | Secondary hero card (scroll) | Fixnado illustration | Licensed internally |
| `search-icon` | `packages/icons/src/svg/search-24.svg` | 24×24 | SVG | Search bar icon | Custom | |
| `filter-service` | `packages/icons/src/svg/filter-service.svg` | 24×24 | SVG | Quick filter pill icon | Custom | |

## Geo-Zonal Explorer
| Asset ID | File | Dimensions | Usage |
| --- | --- | --- | --- |
| `map-style` | Mapbox style `fixnado-zones-web-v7` | Vector tiles | Primary map layer |
| `map-sprite` | `public/assets/maps/fixnado-sprite@2x.png` | 512×512 | Mapbox sprite sheet for icons |
| `legend-core` | `public/assets/maps/legend-core.svg` | 120×40 | Legend chip for core zones |
| `legend-expansion` | `public/assets/maps/legend-expansion.svg` | 120×40 | Legend chip for expansion zones |
| `legend-restricted` | `public/assets/maps/legend-restricted.svg` | 120×40 | Legend chip with hatch pattern |
| `avatar-placeholder` | `public/assets/providers/avatar-placeholder.svg` | 120×120 | Provider default avatar |

## Dashboard & Analytics
| Asset ID | File | Dimensions | Usage |
| --- | --- | --- | --- |
| `metric-bookings` | `packages/icons/src/svg/metric-bookings.svg` | 32×32 | KPI tile icon |
| `metric-revenue` | `packages/icons/src/svg/metric-revenue.svg` | 32×32 | KPI tile icon |
| `chart-theme` | `public/charts/echarts-theme-fixnado.json` | JSON | Applied to ECharts instances |
| `empty-dashboard` | `public/assets/illustrations/empty-dashboard.svg` | 320×320 | Empty state |
| `empty-table` | `public/assets/illustrations/empty-table.svg` | 320×320 | Table empty state |
| `activity-avatar` | `public/assets/providers/activity-default.jpg` | 160×160 (served at 48px) | Activity feed avatar fallback |

## Marketplace & Packages
| Asset ID | File | Dimensions | Notes |
| --- | --- | --- | --- |
| `marketplace-cleaning` | `public/assets/marketplace/marketplace-cleaning@2x.jpg` | 1920×1280 | Gradient overlay 40%; compressed <200KB |
| `marketplace-installations` | `public/assets/marketplace/marketplace-installations@2x.jpg` | 1920×1280 | Use same overlay as above |
| `package-icon-ads` | `packages/icons/src/svg/package-ads.svg` | 48×48 | Ads package icon |
| `package-icon-video` | `packages/icons/src/svg/package-video.svg` | 48×48 | Video call package |
| `package-icon-compliance` | `packages/icons/src/svg/package-compliance.svg` | 48×48 | Compliance add-on |

## Compliance & Settings
| Asset ID | File | Dimensions | Usage |
| --- | --- | --- | --- |
| `compliance-lock` | `public/assets/illustrations/compliance-lock.svg` | 360×320 | Compliance hero |
| `document-pdf` | `packages/icons/src/svg/document-pdf.svg` | 24×24 | File list icon |
| `document-image` | `packages/icons/src/svg/document-image.svg` | 24×24 | File list icon |
| `support-team` | `public/assets/support/support-team@2x.jpg` | 1600×900 | Settings support module |

## Motion Assets
- `insight-orbit.json` — Lottie animation (540×360) used in analytics hero. Fallback PNG `insight-orbit.png` (1080×720). Stored in `public/assets/motion/`.
- `map-pulse.json` — Lottie for map hotspot indicator (64×64). Use sparingly to avoid performance issues (<60fps).

## Optimisation Pipeline
1. Designers export assets to `/assets/raw`. Include metadata file with `title`, `description`, `altText`, `source`, `license`.
2. Run `pnpm assets:process` which:
   - Compresses JPEG (quality 82) with `mozjpeg`.
   - Converts PNG to WebP (quality 85) while keeping PNG fallback for Safari <14.
   - Optimises SVG using `svgo` (plugins: `removeDimensions=false`, `removeViewBox=false`, `cleanupIDs=true`).
3. Generate checksum manifest `assets-manifest.json` with `sha256` for cache busting.
4. Upload large files (>1MB) to S3 `fixnado-web-assets` with CloudFront invalidation triggered via GitHub Actions.

## Accessibility & Performance
- Provide descriptive `alt` text for all meaningful images. Example: `hero-city-grid` alt `"Map showing Fixnado service zones across city grid"`.
- Decorative vectors set `role="presentation"` and `aria-hidden="true"`.
- Ensure Lottie animations respect `prefers-reduced-motion` (stop animation, show static frame).
- Target hero LCP < 2.5s: use `<link rel="preload">` for hero image at 1440w.
- Use `loading="lazy"` for below-the-fold images (marketplace, testimonials).

## Asset Governance
- Maintain Figma component library `Fixnado Web Assets v1.00` linking to file paths.
- Weekly asset sync ensures repo and DAM parity; automated job checks for missing references.
- Asset retirement requires update to manifest and removal from `Screens_update_images_and_vectors.md` plus `colours.md` overlays.
