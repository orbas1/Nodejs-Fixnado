# Image & Vector Asset Plan — Phone Application v1.00

## Asset Sources
- **Illustrations & Icons**: Hosted in internal repository `git@design.fixnado.com:design-system/mobile-assets.git`, branch `v1.00`.
- **Photography**: Licensed from Unsplash Enterprise collection `fixnado-geo-services`. Downloaded via DAM with filenames specified below.
- **Lottie Animations**: Stored in `design-system/lottie@v1.2`. Export to `assets/lottie/` with JSON names.

## Onboarding & Empty States
| Screen | Asset | Type | Dimensions | Notes |
| --- | --- | --- | --- | --- |
| Onboarding Slide 1 | `onboarding_zones.json` | Lottie | 240×240dp container | Animated polygons showing geo expansion |
| Onboarding Slide 2 | `onboarding_marketplace.json` | Lottie | 240×240dp | Illustrates marketplace listing |
| Onboarding Slide 3 | `onboarding_compliance.json` | Lottie | 240×240dp | Document checklist animation |
| Empty Explore | `empty_explore.png` | PNG | 800×600px | Use when no providers match filters |
| Empty Messages | `empty_messages.svg` | SVG | scalable | Soft gradient background |

## Explore & Marketplace
| Component | Asset | Source | Specs |
| --- | --- | --- | --- |
| Provider hero images | `provider_{id}.webp` | Provider upload (CDN) | 1200×800, convert to 3 resolutions (1x,2x,3x) |
| Promotion banners | `promo_home_repair.jpg`, `promo_cleaning.jpg` | Unsplash Enterprise IDs (#12345, #67891) | Apply overlay gradient `rgba(12,18,32,0.64)` |
| Zone legend icons | `icon_zone_core.svg`, etc. | Design system repo | 24dp artboard, stroke 2dp |
| Map markers | `marker_provider_active.svg`, `marker_provider_idle.svg` | Design system repo | 36dp artboard, drop shadow built-in |

## Booking & Payments
| Asset | Type | Notes |
| --- | --- | --- |
| `payment_success.json` | Lottie | Confetti burst 220×220dp |
| `payment_failed.json` | Lottie | Loop 1.5s, use in error screen |
| Card brand logos | SVG set | `visa.svg`, `mastercard.svg`, `amex.svg` stored in `assets/payment/` |

## Messaging
- Avatar placeholders: `avatar_user_default.svg`, `avatar_provider_default.svg` (48dp). Round shape with gradient fill.
- Attachment icons: `icon_camera.svg`, `icon_gallery.svg`, `icon_document.svg` (24dp).

## Profile & Settings
| Screen | Asset | Details |
| --- | --- | --- |
| Profile header | `profile_polygon_overlay.svg` | 360×200dp, 20% opacity overlay |
| Settings icons | `icon_notification.svg`, `icon_security.svg`, etc. | 24dp, line icons 2dp stroke |
| Subscription badges | `badge_basic.svg`, `badge_pro.svg`, `badge_enterprise.svg` | 32dp, gradient backgrounds |

## Compliance & Documents
- Document thumbnails generated via PDF preview; placeholder `doc_placeholder.svg` 160×200dp.
- Compliance illustration `compliance_shield.svg` used in hero card.

## Export & Implementation Notes
- All SVG assets optimised with SVGO (remove metadata, precision 3).
- Provide Flutter `pubspec.yaml` entries referencing asset directories.
- Use `AssetImage` with `Image.asset` for raster, `SvgPicture.asset` for vector. Cache width set to displayed dimension.
- Maintain asset naming using snake_case; store multi-resolution images under `assets/images/providers/{1.0x,2.0x,3.0x}/`.
