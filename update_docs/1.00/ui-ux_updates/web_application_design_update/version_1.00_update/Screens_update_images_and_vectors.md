# Image & Vector Assets — Web Application v1.00

## Asset Sources
- **Photography**: Enterprise license via Unsplash API `fixnado-web-collection`. Store in DAM folder `web/v1.00/hero`.
- **Icons**: `@fixnado/icons` package, Figma export -> `apps/web/public/icons/`.
- **Illustrations**: `fixnado-illustrations` repo tag `v1.4-web`. Use SVG for scalability.
- **Lottie/Animation**: Minimal on web; hero uses subtle gradient animation via CSS.

## Landing & Explorer
| Asset | Type | Usage |
| --- | --- | --- |
| `hero_city_grid.jpg` | 2400×1400px JPG | Landing hero background |
| `illustration_zones.svg` | SVG | How it works section |
| `icon_filter_service.svg` etc. | SVG | Quick filter icons |

## Map Explorer
- Mapbox style `fixnado-zones-web-v7`. Provide sprite sheet path `/maps/fixnado-sprite@2x.png`.
- Provider avatars pulled from CDN; fallback `avatar_placeholder.svg`.
- Zone legend icons `legend_core.svg`, `legend_expansion.svg` stored in `public/legend/`.

## Dashboard & Analytics
| Component | Asset | Details |
| --- | --- | --- |
| KPI cards | `icon_metric_bookings.svg`, `icon_metric_revenue.svg` | 32px line icons |
| Charts | ECharts theme JSON `echarts-theme-fixnado.json` | stored `public/charts/` |
| Empty states | `empty_dashboard.svg`, `empty_table.svg` | 320×320px |

## Marketplace
- Banner imagery `marketplace_cleaning.jpg`, `marketplace_installations.jpg` with gradient overlay.
- Campaign icons `icon_campaign_ads.svg`, `icon_campaign_video.svg`.

## Compliance
- Document icons `icon_pdf.svg`, `icon_doc.svg`, `icon_image.svg`.
- Illustration `compliance_lock.svg` for hero.

## Settings & Support
- Iconography `icon_profile.svg`, `icon_notifications.svg`, `icon_security.svg` etc.
- Support hero `support_team.jpg` 1600×900px.

## Export & Optimization
- Run imagery through ImageOptim, export WebP (quality 85) + fallback JPG.
- Use `next/image` with responsive sizes (hero 320,640,1280,1920 widths).
- SVGs optimized with SVGO (float precision 2).
