# Colour Tokens & Usage — Phone Application v1.00

## Core Palette
| Token | Hex | Role |
| --- | --- | --- |
| `fixnado.primary.500` | #0066F5 | Primary buttons, active nav, FAB |
| `fixnado.primary.600` | #0052C4 | Pressed state |
| `fixnado.primary.050` | #E6F0FF | Light backgrounds |
| `fixnado.secondary.500` | #1BBF92 | Success CTAs, toggles |
| `fixnado.accent.promotions` | #FF6B3D | Promotional highlights |
| `fixnado.warning.500` | #F59E0B | Warnings |
| `fixnado.danger.500` | #E74C3C | Errors |
| `fixnado.neutral.900` | #111827 | Text headings |
| `fixnado.neutral.700` | #1F2937 | Primary body text |
| `fixnado.neutral.500` | #4B5563 | Secondary text |
| `fixnado.neutral.300` | #9CA3AF | Borders |
| `fixnado.neutral.050` | #F7F9FC | Page background |

## Extended Tokens
- **Elevation overlays**: `rgba(12,34,66,0.08)` level1, `rgba(12,34,66,0.12)` level2, `rgba(12,34,66,0.18)` level3.
- **Focus**: `#0EA5E9`.
- **Link**: `#2563EB` with hover `#1D4ED8`.

## Semantic Mapping
| Context | Colour |
| --- | --- |
| Zone: Core | `rgba(0,102,245,0.32)` fill, border `#0066F5` |
| Zone: Expansion | `rgba(27,191,146,0.24)` fill |
| Zone: Prospective | `rgba(243,156,18,0.22)` fill |
| Zone: Restricted | `rgba(231,76,60,0.18)` fill |
| Booking status: Pending | `#F59E0B` badge |
| Booking status: Confirmed | `#1BBF92` |
| Booking status: Cancelled | `#E74C3C` |
| Compliance: On Track | `#1BBF92` |
| Compliance: Action Required | `#F39C12` |
| Compliance: Critical | `#E74C3C` |

## Gradients Library
- `gradient.primary.hero`: `135° #1C62F0 → #4C8DF8`.
- `gradient.secondary.promo`: `150° #FF6B3D → #FF8A5A`.
- `gradient.zone.legend`: `120° #1BBF92 → #0EA5E9` used for enterprise tier highlights.
- `gradient.darkOverlay`: `rgba(12,18,32,0)` → `rgba(12,18,32,0.72)` for text legibility over photography.

## Dark Theme Tokens
| Light | Dark Equivalent |
| --- | --- |
| `fixnado.neutral.050` | `#0B1120` |
| `fixnado.neutral.900` | `#F9FAFB` |
| `fixnado.neutral.700` | `#E2E8F0` |
| `fixnado.neutral.500` | `#94A3B8` |
| `fixnado.primary.500` | `#3B82F6` |
| `fixnado.secondary.500` | `#34D399` |

## Implementation
- Define tokens in Flutter using `ColorScheme` extension `FixnadoColors`. Provide JSON export for dev pipeline: `design-tokens/mobile/v1.00/colors.json`.
- Enforce use through lint rule: no raw hex outside theme files.
- Provide utilities for gradient backgrounds ensuring border radius coverage.
- Document palette in Figma token plugin; maintain `color-usage` variants per component state (default/hover/pressed/disabled/focus) to allow automation.
- Provide CSS variable mapping for web parity: e.g., `--fixnado-color-primary-500` to align cross-platform design system.

## Accessibility
- Validate contrast ratios using `accessibility_inspector`. Primary on white = 7.02:1, body text on neutral-050 = 9.65:1.
- Provide alternative patterns (dashed outlines) for colour-blind critical states (restricted zones) in map legend.
- Use colour blind safe palette testing (Sim Daltonism) verifying red/green differentiation for compliance statuses; adjust saturation as needed.
- Document allowed gradients for overlays to avoid flicker when animating (limit to 2 colour stops per gradient for performance).
