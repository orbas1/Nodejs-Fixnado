# Screen Colour Specifications — Phone Application v1.00

## Palette Tokens
| Token | Hex | Usage |
| --- | --- | --- |
| `--color-primary-500` | #0066F5 | Primary actions, active nav icons |
| `--color-primary-600` | #0052C4 | Pressed state |
| `--color-primary-100` | #D0DEF9 | Light backgrounds, focus outlines |
| `--color-secondary-500` | #FF6B3D | Promotions, urgency CTA |
| `--color-success-500` | #1BBF92 | Success badges, verification |
| `--color-warning-500` | #F39C12 | Pending compliance, expiring documents |
| `--color-danger-500` | #E74C3C | Errors, destructive buttons |
| `--color-neutral-000` | #FFFFFF | Cards, surfaces |
| `--color-neutral-050` | #F7F9FC | Backgrounds |
| `--color-neutral-500` | #4B5563 | Secondary text |
| `--color-neutral-900` | #111827 | Headlines |

## Gradients
- **Primary Hero**: `linear-gradient(135°, #1C62F0 0%, #4C8DF8 100%)` used in Explore ribbon, onboarding backgrounds.
- **Secondary Accent**: `linear-gradient(160°, #FF6B3D 0%, #FF8A5A 100%)` used for promotional banners.
- **Compliance Alert**: `linear-gradient(180°, #FDE68A 0%, #F59E0B 100%)` for warning hero cards.

## Role-Based Rings & Badges
- Subscription tiers for providers (used around avatar):
  - Basic: border `#CBD5F5` 4dp.
  - Pro: gradient `#1BBF92 → #0EA5E9`.
  - Enterprise: gradient `#8B5CF6 → #1C62F0` with inner shadow `rgba(12,18,32,0.24)`.

## Map Colours
| Zone Tier | Fill | Stroke |
| --- | --- | --- |
| Core | `rgba(0,102,245,0.32)` | `rgba(0,102,245,0.72)` 2dp |
| Expansion | `rgba(27,191,146,0.24)` | `rgba(27,191,146,0.64)` 2dp |
| Prospective | `rgba(243,156,18,0.22)` | `rgba(243,156,18,0.6)` 2dp |
| Restricted | `rgba(231,76,60,0.18)` | `rgba(231,76,60,0.56)` 2dp |

## State Colours
- Disabled buttons: `rgba(17,24,39,0.16)` background, text `rgba(17,24,39,0.48)`.
- Skeleton shimmer: gradient `rgba(207,217,242,0.6)` to `rgba(207,217,242,0.3)`.
- Error text: `#C0392B` with underline for input fields.
- Offline banner: `#B91C1C` background, text `#FFFFFF`.

## Elevation & Shadows
| Elevation Level | Shadow | Usage |
| --- | --- | --- |
| Level 1 | `0 4 12 rgba(12,34,66,0.08)` | Cards in lists |
| Level 2 | `0 10 28 rgba(12,34,66,0.12)` | Modals, bottom sheets |
| Level 3 | `0 18 48 rgba(12,34,66,0.18)` | FAB, floating map controls |

## Dark Mode Preparation
- Background `#0B1120`, card `#111827`.
- Primary lighten to `#3B82F6` for contrast.
- Text `#F9FAFB` for headings, `#CBD5F5` for body.
- Use same accent tokens for warnings but adjust opacity to 40% for backgrounds.

## Colour Pairings & Usage Notes
- **Primary Button**: Gradient overlay plus highlight stroke `rgba(255,255,255,0.16)` top to accentuate depth.
- **Map Controls**: Use neutral-000 background with shadow level 3, icons tinted `#1F2937` for contrast on gradient map.
- **Compliance Alerts**: Combine gradient backgrounds with icon circle `#FFFFFF` 40dp to maintain readability.
- **Analytics Charts**: Assign palette — Bookings `#1C62F0`, Earnings `#1BBF92`, Cancellations `#E74C3C`, Response Time `#F59E0B`.
- **Profile Tier Badges**: Basic `#CBD5F5`, Pro gradient `#60A5FA → #2563EB`, Enterprise gradient `#8B5CF6 → #1C62F0` with inner glow `rgba(255,255,255,0.24)`.

## Transparency Guidelines
- Overlay surfaces use increments of 8% opacity to ensure consistent stacking: 8%, 16%, 24%, 32%, 40%.
- For map polygons ensure combined fill + heatmap does not exceed 45% opacity to keep base tiles legible.
- Modal scrims `rgba(15,23,42,0.48)` to maintain readability while emphasising focus.

## Testing Requirements
- Run automated contrast checks via Stark plugin across light/dark variants (document results in QA sheet).
- Validate colour rendering on reference devices (Pixel 5, iPhone 12, Galaxy A52) to account for OLED vs LCD differences.
- Provide design tokens in `.ase` (Adobe Swatch Exchange) for marketing alignment.

## Accessibility Compliance
- All primary text on gradients uses overlay layer `rgba(0,0,0,0.24)` to maintain contrast.
- Buttons ensure contrast >7:1 on primary background.
- Focus outlines `#0EA5E9` 2dp consistent across components.
