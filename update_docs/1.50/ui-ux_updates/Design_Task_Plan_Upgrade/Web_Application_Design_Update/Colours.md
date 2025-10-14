# Web Colour System

## Palette Overview
| Token | Hex | Usage |
| --- | --- | --- |
| `color.brand.navy.700` | #1A237E | Headers, buttons, key links |
| `color.brand.sky.400` | #42A5F5 | Highlights, hover states |
| `color.brand.teal.400` | #26C6DA | Success messages, data visuals |
| `color.brand.amber.400` | #FFCA28 | Warnings, action prompts |
| `color.brand.red.500` | #EF5350 | Errors, destructive actions |
| `color.neutral.950` | #0F1222 | Primary text |
| `color.neutral.700` | #3B4160 | Secondary text |
| `color.neutral.500` | #6F7390 | Tertiary text, placeholders |
| `color.neutral.200` | #D7DBEC | Borders, dividers |
| `color.surface.base` | #FFFFFF | Page background |
| `color.surface.alt` | #F5F7FF | Card background |
| `color.surface.elevated` | #EBEFFA | Sidebars, panels |

## Gradient Usage
- Hero gradient: `linear-gradient(120deg, #1A237E 0%, #42A5F5 50%, #26C6DA 100%)` overlay at 70%.
- CTA gradient: `linear-gradient(135deg, #1A237E, #3949AB)` for primary marketing banners.

## Accessibility
- Ensure text on `surface.alt` uses `neutral.900` or darker.
- Data visual palettes include colourblind-friendly combos: Blue (#42A5F5), Purple (#7E57C2), Green (#26A69A), Orange (#FB8C00).
- Provide alternative patterns for charts when more than five series.

## Dark Mode
- Base background `#101522`, surfaces `#141A2C`, text `#E6E9F8`.
- Buttons lighten to `#5C6BC0` for contrast; adjust border colours accordingly.

## Implementation Notes
- Tokens exported as CSS variables in `:root`; dark mode overrides via `[data-theme="dark"]` attribute.
- Document usage guidelines to avoid mixing brand colours with non-semantic contexts.
