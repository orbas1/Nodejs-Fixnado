# Colour Application Catalogue — Web Application v1.00

> For base tokens see `Colours.md`. This document maps token usage to real screens, gradients, and accessibility checks to ensure consistent application.

## Hero & Marketing Sections
- **Hero Gradient**: `linear-gradient(135deg, #0B1120 0%, #1445E0 45%, #0EA5E9 100%)` overlaying photography at 72% opacity.
- **Call-to-Action Buttons**: Primary `#1445E0` background, text `#FFFFFF`, hover `#0E33A8`, focus outline `#0EA5E9` 3px.
- **Secondary CTA**: Outline variant `#FFFFFF` 1.5px border, text `#FFFFFF`, hover fill `rgba(14,51,168,0.24)`.

## Map & Geo Zones
| Zone State | Fill | Stroke | Label |
| --- | --- | --- | --- |
| Active Service Area | `rgba(20,69,224,0.32)` | `#1445E0` 2px | Label chip background `#1445E0`, text `#FFFFFF` |
| Expansion Target | `rgba(14,165,233,0.24)` | `#0EA5E9` 2px dashed | Label `#0EA5E9` text `#0B1120` |
| Restricted Zone | `rgba(232,90,90,0.28)` pattern overlay | `#E85A5A` 2px solid | Label `#E85A5A` text `#FFFFFF` |
| Premium Coverage | Gradient `#FF6B3D → #FF8A5A` 60% opacity | `#FF6B3D` 2px solid | Label `#FF6B3D` text `#0B1120` |

## Dashboard Widgets
- **Metric Tiles**: Background `#FFFFFF`, icon circle tinted `rgba(20,69,224,0.12)`, metric text `#0B1120`, supporting label `#4B5563`.
- **Trend Indicators**: Up arrow `#00B894`, down arrow `#E85A5A`. Neutral trend `#9CA3AF`.
- **Analytics Cards**: Use `gradient.analytics` as header background with white text and 88% overlay.

## Tables & Forms
- **Row Hover**: `background: rgba(20,69,224,0.06)`.
- **Selected Row**: `border-left: 4px solid #1445E0`, `background: rgba(20,69,224,0.12)`.
- **Form Helper Text**: `#4B5563`, error text `#E85A5A`, success text `#00B894`.
- **Disabled Input**: `background: rgba(148,163,184,0.12)`, text `#6B7280`.

## Notifications & Messaging
| Type | Background | Border/Icon | Text |
| --- | --- | --- | --- |
| Success | `rgba(0,184,148,0.14)` | `#00B894` | `#014F3E` |
| Info | `rgba(14,165,233,0.16)` | `#0EA5E9` | `#0B1120` |
| Warning | `rgba(255,176,32,0.18)` | `#FFB020` | `#5C3200` |
| Danger | `rgba(232,90,90,0.2)` | `#E85A5A` | `#4A0F0F` |

## Dark Mode Mapping
- Convert surfaces to `#0F172A` and adjust neutrals: `--color-neutral-900-dark = #F8FAFC`, `--color-neutral-700-dark = #CBD5F5`.
- Primary CTA `#3B82F6`, hover `#2563EB`, focus ring `rgba(14,165,233,0.6)`.
- Table stripes `rgba(15,23,42,0.72)` alternating with `rgba(30,41,59,0.72)`.

## Accessibility Checklist
- Verify contrast with `axe-core`: CTA (#1445E0) on white yields ratio 7.1:1.
- Danger background (#E85A5A at 20%) with white text (#FFFFFF) ratio 4.6:1 (pass for large text). For body text, overlay tinted `rgba(232,90,90,0.3)` to reach 7.2:1 with `#0B1120` text.
- Provide texture overlays (diagonal stripes) for statuses in addition to colour to support colour-blind accessibility.

## Asset Colour Management
- Export all imagery in sRGB, embed ICC profile for browsers.
- For tinted photography, use gradient overlays rather than editing base asset to maintain reuse.
- Provide `.ase` palette file in `assets/palettes/web-v1.00.ase` for marketing designers.
