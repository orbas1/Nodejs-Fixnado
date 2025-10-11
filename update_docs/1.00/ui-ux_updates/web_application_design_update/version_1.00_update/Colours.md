# Colour Tokens — Web Application v1.00

> Token naming convention: `fixnado-color-{category}-{scale}`. Hex values are WCAG-compliant; RGBA conversions provided for overlays. Each token exported to CSS (`:root` and `[data-theme="dark"]`), TypeScript, and JSON to keep platform parity.

## Core Palette
| Token | Hex | RGBA | Usage | Notes |
| --- | --- | --- | --- | --- |
| `--fixnado-color-primary-500` | #1445E0 | rgba(20, 69, 224, 1) | Primary CTAs, links | Minimum contrast 7.1:1 on white |
| `--fixnado-color-primary-600` | #0E33A8 | rgba(14, 51, 168, 1) | Hover/active states | Use for focus ring on dark surfaces |
| `--fixnado-color-primary-050` | #E8EEFF | rgba(232, 238, 255, 1) | Pill backgrounds, table headers | Aligns with map legend chips |
| `--fixnado-color-secondary-500` | #00B894 | rgba(0, 184, 148, 1) | Success messaging, positive metrics | Works with white text 5.8:1 |
| `--fixnado-color-secondary-600` | #009C7D | rgba(0, 156, 125, 1) | Hover for success buttons | |
| `--fixnado-color-accent-amber` | #FFB020 | rgba(255, 176, 32, 1) | Warning states, promotions | Combine with `#5C3200` text |
| `--fixnado-color-danger-500` | #E85A5A | rgba(232, 90, 90, 1) | Errors, destructive actions | Provide tinted backgrounds 16% opacity |
| `--fixnado-color-info-500` | #0EA5E9 | rgba(14, 165, 233, 1) | Informational alerts, focus outlines | |
| `--fixnado-color-neutral-000` | #FFFFFF | rgba(255, 255, 255, 1) | Surface background | |
| `--fixnado-color-neutral-050` | #F5F7FB | rgba(245, 247, 251, 1) | Page background | |
| `--fixnado-color-neutral-100` | #E8EEFF | rgba(232, 238, 255, 1) | Section separators | |
| `--fixnado-color-neutral-300` | #9CA3AF | rgba(156, 163, 175, 1) | Borders, disabled text | |
| `--fixnado-color-neutral-500` | #4B5563 | rgba(75, 85, 99, 1) | Body text | |
| `--fixnado-color-neutral-700` | #1F2937 | rgba(31, 41, 55, 1) | Secondary headings | |
| `--fixnado-color-neutral-900` | #0B1120 | rgba(11, 17, 32, 1) | Headlines | |

## Semantic Tokens
| Context | Token | Colour | Usage |
| --- | --- | --- | --- |
| Booking Status — Pending | `--fixnado-color-status-pending` | #FFB020 | Pill background + border, timeline nodes |
| Booking Status — Confirmed | `--fixnado-color-status-confirmed` | #00B894 | Pill background, progress bars |
| Booking Status — Cancelled | `--fixnado-color-status-cancelled` | #E85A5A | Alerts, table row indicator |
| Compliance — At Risk | `--fixnado-color-compliance-risk` | #FF6B3D | Document warnings |
| Compliance — Verified | `--fixnado-color-compliance-verified` | #00B894 | Check badges |
| Marketplace — Sponsored | `--fixnado-color-marketplace-sponsored` | `linear-gradient(135deg, #FF6B3D 0%, #FF8A5A 100%)` | Sponsored ribbons |
| Analytics — Trend Up | `--fixnado-color-trend-up` | #00B894 | Trend indicators |
| Analytics — Trend Down | `--fixnado-color-trend-down` | #E85A5A | Trend indicators |
| Chat — Agent | `--fixnado-color-chat-agent` | #1445E0 | Chat bubble background |
| Chat — User | `--fixnado-color-chat-user` | #0EA5E9 | Chat bubble background |

## Gradients
| Token | Definition | Application |
| --- | --- | --- |
| `--fixnado-gradient-hero` | `linear-gradient(135deg, rgba(11,17,32,0.92) 0%, rgba(20,69,224,0.88) 55%, rgba(14,165,233,0.82) 100%)` | Landing hero overlay (ensures 4.5:1 contrast with white text) |
| `--fixnado-gradient-analytics` | `linear-gradient(135deg, #1BBF92 0%, #0EA5E9 100%)` | Analytics highlight cards, action tiles |
| `--fixnado-gradient-danger` | `linear-gradient(135deg, #E85A5A 0%, #C94C4C 100%)` | Critical alerts, destructive confirm modals |
| `--fixnado-gradient-package-premium` | `linear-gradient(160deg, rgba(20,69,224,0.18) 0%, rgba(20,69,224,0.42) 100%)` | Premium package cards |
| `--fixnado-gradient-map-surge` | `linear-gradient(180deg, rgba(255, 107, 61, 0.4) 0%, rgba(255, 176, 32, 0.05) 100%)` | Map surge overlays |

## Elevation Shadows
| Level | Shadow | Usage | Notes |
| --- | --- | --- | --- |
| `--fixnado-shadow-1` | `0 8px 24px rgba(12, 18, 32, 0.08)` | Cards, tiles | Equivalent blur radius 24px |
| `--fixnado-shadow-2` | `0 16px 40px rgba(12, 18, 32, 0.12)` | Sticky headers, drawers | Combined with `backdrop-filter: blur(12px)` |
| `--fixnado-shadow-3` | `0 24px 64px rgba(12, 18, 32, 0.18)` | Modals, toasts | Maintain 16px radius |
| `--fixnado-shadow-4` | `0 32px 72px rgba(12, 18, 32, 0.22)` | Command palette, lightboxes | Ensure overlay dims to `rgba(12,18,32,0.45)` |

## Dark Mode Tokens
| Token | Value | Notes |
| --- | --- | --- |
| `--fixnado-dark-surface` | #0F172A | Card background |
| `--fixnado-dark-surface-elevated` | #111C33 | Elevated components |
| `--fixnado-dark-text-primary` | #F8FAFC | Body text |
| `--fixnado-dark-text-secondary` | #CBD5F5 | Secondary text |
| `--fixnado-dark-border` | rgba(148, 163, 184, 0.24) | Divider lines |
| `--fixnado-dark-primary` | #3B82F6 | Primary CTA |
| `--fixnado-dark-focus` | rgba(14, 165, 233, 0.6) | Focus outline |
| `--fixnado-dark-accent` | `linear-gradient(135deg, rgba(27,191,146,0.32) 0%, rgba(14,165,233,0.28) 100%)` | Analytics highlight |

## Accessibility & Compliance
- Minimum contrast ratios: Primary vs white 7.1:1; neutral text vs background 12.4:1; table header text vs header background 5.3:1.
- Provide textured overlays for map statuses: hashed pattern for restricted zones, dotted pattern for prospective zones.
- For `prefers-contrast: more`, lighten backgrounds by 12% and thicken borders to 2px.
- Provide `prefers-reduced-motion` variant of gradients (static backgrounds) by removing animated gradient overlays.
- Validate palettes via Stark plugin and automated tests in CI (`pnpm test:contrast`).

## Implementation Notes
- Tokens defined in `packages/design-tokens/src/colors.ts` and exported as JSON (`dist/colors.json`), CSS (`dist/colors.css`), TS (`dist/colors.d.ts`).
- CSS variables loaded via `globals.css` under `:root`. Example usage: `background-color: var(--fixnado-color-neutral-050);`.
- Dark mode toggled by `<html data-theme="dark">`. Provide smooth transition `transition: background-color 160ms` to avoid flash.
- React theme object merges base + dark tokens; use `ThemeProvider` from `styled-components`.
- Document usage patterns in Storybook `Tokens/Colors` with live preview swatches referencing actual CSS variables.

## Colour Governance
- All new colour requests require design review and addition to `Colours.md` + `colours.md` application mapping.
- Monthly audit ensures tokens align with marketing assets; update hero overlays if marketing imagery evolves.
- Maintain `.ase` palette file `assets/palettes/fixnado-web-v1.ase` for marketing team; update alongside code release.
