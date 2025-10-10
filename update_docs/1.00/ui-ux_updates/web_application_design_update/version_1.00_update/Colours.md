# Colour Tokens — Web Application v1.00

## Core Palette
| Token | Value | Usage |
| --- | --- | --- |
| `color.primary.500` | #1445E0 | Primary CTAs |
| `color.primary.600` | #0E33A8 | Hover/active |
| `color.secondary.500` | #00B894 | Success actions |
| `color.accent.orange` | #FFB020 | Promotions, warnings |
| `color.danger.500` | #E85A5A | Errors |
| `color.info.500` | #0EA5E9 | Info alerts |
| `color.neutral.900` | #0B1120 | Headers |
| `color.neutral.700` | #1F2937 | Body text |
| `color.neutral.500` | #4B5563 | Secondary text |
| `color.neutral.300` | #9CA3AF | Borders |
| `color.neutral.050` | #F5F7FB | Page background |

## Elevation Shadows
| Level | Shadow |
| --- | --- |
| 1 | `0 8px 24px rgba(12,18,32,0.08)` |
| 2 | `0 16px 40px rgba(12,18,32,0.12)` |
| 3 | `0 24px 64px rgba(12,18,32,0.18)` |

## Semantic Tokens
- Booking statuses: Pending `#FFB020`, Confirmed `#00B894`, Cancelled `#E85A5A`.
- Compliance: On track `#00B894`, Action needed `#FFB020`, Critical `#E85A5A`.
- Promotions: `#FF6B3D` accent gradient `#FF6B3D → #FF8A5A` for badges.

## Gradients
- `gradient.hero`: `linear-gradient(135deg, #1445E0 0%, #0B1120 100%)`.
- `gradient.analytics`: `linear-gradient(135deg, #1BBF92 0%, #0EA5E9 100%)`.
- `gradient.danger`: `linear-gradient(135deg, #E85A5A 0%, #C94C4C 100%)`.

## Dark Mode
- Background `#050A1A`, surface `#0F172A`.
- Text `#E2E8F0`, secondary `#94A3B8`.
- Primary lighten to `#3B82F6` for contrast.

## Implementation
- Export tokens to CSS via `tokens/colors.css` with `:root` variables (e.g., `--color-primary-500`).
- Provide TypeScript definitions for theme consumption.
- Ensure tokens mirrored in design system library for parity with mobile.

## Accessibility
- Primary on white contrast ratio 7.1:1.
- Secondary on white 3.2:1; use for backgrounds with dark text to maintain 4.5:1.
- Provide alternative patterns for heatmap overlays to support colour blindness (striped restricted zones).
