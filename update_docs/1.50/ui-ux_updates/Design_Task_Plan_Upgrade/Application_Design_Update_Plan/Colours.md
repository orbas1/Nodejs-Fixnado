# Colour System Specification

## Core Palette
| Token | Hex | Usage |
| --- | --- | --- |
| `color.primary.600` | #3F51B5 | Primary CTAs, active navigation, verification highlights |
| `color.primary.400` | #6574C4 | Secondary actions, info banners |
| `color.accent.500` | #FFB300 | Alerts, action queue priority badges |
| `color.success.500` | #26A69A | Success toasts, payout confirmations |
| `color.error.600` | #C62828 | Critical alerts, validation errors |
| `color.warning.500` | #FB8C00 | Schedule conflicts, pending verification |
| `color.info.500` | #29B6F6 | Tips, educational banners |
| `color.neutral.900` | #1E1E24 | Headings, high-emphasis text |
| `color.neutral.700` | #3B3B45 | Body text |
| `color.neutral.500` | #6F7080 | Secondary text, helper copy |
| `color.neutral.200` | #D6D7E3 | Dividers, borders |
| `color.surface.0` | #FFFFFF | Base background |
| `color.surface.1` | #F5F6FB | Card backgrounds |
| `color.surface.2` | #EEF0F8 | Drawers, modals |

## Accessibility Considerations
- All text/background combinations achieve at least 4.5:1 contrast; high-contrast mode swaps surfaces to `color.surface.1` with text at `color.neutral.900`.
- Status colours paired with iconography and descriptive text to avoid colour-only cues.
- Focus states use `color.info.500` ring with 3px width to ensure visibility on both light and dark backgrounds.

## Gradients & Overlays
- Hero gradient: `linear-gradient(135deg, rgba(63,81,181,0.92) 0%, rgba(41,182,246,0.88) 100%)` applied to onboarding cards.
- Overlay scrim for modals: `rgba(16, 21, 42, 0.48)` to emphasise focus while maintaining context.
- Chart palettes include complementary hues to avoid confusion when multiple series present.

## Dark Mode Tokens
- `color.surface.dark.0` #10131F, `surface.dark.1` #161B2C, `surface.dark.2` #1F2740.
- Text tokens lighten to `#E6E9F8` for headings, `#C3C7DA` for body.
- Primary accent shifts to #8C9EFF to preserve contrast; warning and error lighten accordingly.

## Usage Guidelines
- Limit use of accent amber to high-priority alerts to prevent alert fatigue.
- Reserve gradients for hero or celebratory states to maintain brand sophistication.
- When overlaying text on photography, apply 40% scrim to maintain legibility.
