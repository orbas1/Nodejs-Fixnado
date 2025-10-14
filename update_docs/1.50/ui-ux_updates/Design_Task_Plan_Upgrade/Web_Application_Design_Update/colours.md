# Extended Colour Tokens

## Semantic Roles
| Role | Token | Description |
| --- | --- | --- |
| Primary Action | `color.brand.navy.700` | Used for key CTAs and links |
| Secondary Action | `color.brand.sky.500` | Outline buttons, hover states |
| Background Base | `color.surface.base` | Default page backgrounds |
| Background Muted | `color.surface.alt` | Card backgrounds |
| Background Elevated | `color.surface.elevated` | Sidebars, modals |
| Border | `color.neutral.200` | Dividers, card outlines |
| Text Strong | `color.neutral.950` | Headings |
| Text Muted | `color.neutral.500` | Captions, placeholders |
| Info | `color.brand.sky.400` | Informational banners |
| Success | `color.brand.teal.400` | Positive toasts |
| Warning | `color.brand.amber.400` | Schedule alerts |
| Error | `color.brand.red.500` | Validation errors |

## Usage Notes
- Avoid mixing brand accent colours within data visualisations; use dedicated chart palette to maintain clarity.
- Provide 16px minimum spacing between coloured elements to prevent visual noise.
- When overlaying text on hero images, apply gradient scrim of `rgba(26,35,126,0.65)`.

## Theming
- Token structure supports theme overrides; maintain same role names when introducing partner-specific palettes.
- Document theme changes in change log to avoid regressions.
