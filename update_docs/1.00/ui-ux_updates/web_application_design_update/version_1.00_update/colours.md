# Colour Application Catalogue — Web Application v1.00

> This catalogue maps tokens defined in `Colours.md` to specific UI surfaces, including asset overlays, chart palettes, and accessibility checks. Each entry includes pixel measurements for gradients, percentage overlays, and fallback rules for dark mode.

## Hero & Marketing Sections
- **Landing Hero**
  - Background: `hero-city-grid@2x.jpg` (2880×1200) with `--fixnado-gradient-hero` overlay at 92% opacity (CSS `::before` pseudo element covering full width, height 520px).
  - Primary CTA: `--fixnado-color-primary-500`, text `#FFFFFF`, hover `--fixnado-color-primary-600`, focus outline `3px var(--fixnado-color-info-500)`.
  - Secondary CTA: Transparent background, border `1.5px #FFFFFF`, hover background `rgba(255,255,255,0.18)`, text `#FFFFFF`.
  - KPI chips: Background `rgba(20,69,224,0.12)`, icon circle `rgba(20,69,224,0.18)`, text `--fixnado-color-neutral-000`.
- **Promo Banners**
  - Carousel slides: 320px height, gradient `--fixnado-gradient-analytics`, overlay 80% black at bottom for text legibility.
  - Partner logos: monochrome `#FFFFFF` on hero, `#0B1120` on light backgrounds. Provide CSS variable `--fixnado-color-logo` to swap per theme.

## Map & Geo Zones
| Zone State | Fill | Stroke | Label | Tooltip |
| --- | --- | --- | --- | --- |
| Active Service Area | `rgba(20,69,224,0.32)` | `#1445E0` 2px solid | Label chip background `#1445E0`, text `#FFFFFF` | Tooltip header `#1445E0`, body `#0B1120` |
| Expansion Target | `rgba(14,165,233,0.24)` | `#0EA5E9` 2px dashed (8px dash, 6px gap) | Chip `#0EA5E9` text `#0B1120` | Tooltip accent line `#0EA5E9` |
| Restricted Zone | `rgba(232,90,90,0.28)` + 45° hatch pattern (#E85A5A at 24%) | `#E85A5A` 2px solid | Chip `#E85A5A` text `#FFFFFF` | Tooltip background `rgba(232,90,90,0.12)` |
| Premium Coverage | Gradient `--fixnado-gradient-package-premium` 60% opacity | `#1445E0` 2px solid | Chip `#1445E0` text `#FFFFFF` | Tooltip badge `#1445E0` |
| Surge Demand | Gradient `--fixnado-gradient-map-surge` | `#FF6B3D` 3px glow (`box-shadow: 0 0 12px rgba(255,107,61,0.5)`) | Chip `#FF6B3D` text `#0B1120` | Tooltip highlight `#FF6B3D` |

## Dashboard Widgets
- **Metric Tiles**: Background `#FFFFFF`, drop shadow `--fixnado-shadow-1`, icon circle `rgba(20,69,224,0.12)`, metric value `#0B1120`, supporting label `#4B5563`. Trend arrow colours: up `#00B894`, down `#E85A5A`, neutral `#9CA3AF`.
- **Progress Donut**: Ring gradient `--fixnado-gradient-analytics`, background track `rgba(20,69,224,0.12)`, centre label `#0B1120`.
- **Activity Feed**: Timeline dot `#1445E0`, connecting line `rgba(20,69,224,0.16)`, timestamp `#6B7280`.

## Tables & Forms
- Table header background `#E8EEFF`; text `#0B1120` 75% opacity; border bottom `rgba(12,18,32,0.12)`. Hover row `rgba(20,69,224,0.06)`, selected row `rgba(20,69,224,0.12)` with left border `4px #1445E0`.
- Inputs default border `#CBD5F5` 1px; focus border `2px #1445E0`, box-shadow `0 0 0 4px rgba(20,69,224,0.12)`.
- Error state: border `#E85A5A`, helper text `#E85A5A`, icon `#E85A5A`. Success: border `#00B894`, helper text `#009C7D`.
- Disabled input background `rgba(148,163,184,0.12)`, text `#6B7280`, placeholder `rgba(107,114,128,0.68)`.

## Notifications & Messaging
| Type | Background | Border/Icon | Text | Shadow |
| --- | --- | --- | --- | --- |
| Success Toast | `rgba(0,184,148,0.14)` | `#00B894` | `#014F3E` | `--fixnado-shadow-2` |
| Info Toast | `rgba(14,165,233,0.16)` | `#0EA5E9` | `#0B1120` | `--fixnado-shadow-2` |
| Warning Snackbar | `rgba(255,176,32,0.18)` | `#FFB020` | `#5C3200` | `--fixnado-shadow-2` |
| Danger Snackbar | `rgba(232,90,90,0.2)` | `#E85A5A` | `#4A0F0F` | `--fixnado-shadow-3` |
| Chat Agent Bubble | `rgba(20,69,224,0.12)` | none | text `#0B1120` | n/a |
| Chat User Bubble | `rgba(14,165,233,0.2)` | none | text `#0B1120` | n/a |

## Dark Mode Mapping
- Surfaces `var(--fixnado-dark-surface)`, elevated surfaces `var(--fixnado-dark-surface-elevated)`. Buttons use `--fixnado-dark-primary`. Table headers `rgba(148,163,184,0.12)`, gridlines `rgba(148,163,184,0.08)`, text `--fixnado-dark-text-primary`.
- Map overlays: reduce opacity by 20% and lighten strokes to maintain contrast on dark backgrounds.
- Toast backgrounds deepen to `rgba(17,24,39,0.94)` with accent border using same tokens.

## Accessibility Checklist
- Validate every combination using `@axe-core/react` integration. Document pass/fail under `update_docs/1.00/ui-ux_updates/web_application_design_update/version_1.00_update/tests/colour-accessibility.xlsx` (created via QA pipeline).
- Use high-contrast mode: `:root[data-contrast="high"]` overrides (increase border 1px -> 2px, lighten backgrounds 15%). Buttons convert gradients to solid colours to reduce pattern noise.
- Provide alternative patterns for heatmap overlays. Example CSS snippet:
  ```css
  .zone--restricted {
    background-image: repeating-linear-gradient(
      45deg,
      rgba(232,90,90,0.32),
      rgba(232,90,90,0.32) 8px,
      rgba(232,90,90,0.12) 8px,
      rgba(232,90,90,0.12) 16px
    );
  }
  ```

## Implementation Guidance
- `globals.css` defines CSS variables. Use `color-mix()` where supported for overlays (fallback to RGBA).
- Provide SASS mixins (`Scss.md`) for gradients and tinted surfaces to avoid duplication.
- For Next.js `<Image>` components, apply overlays using CSS pseudo-elements to keep original asset reusable.
- Data visualisation colours managed in `public/charts/echarts-theme-fixnado.json`; ensure gradient values match tokens.
- When theming third-party widgets (Stripe, Agora), use CSS overrides referencing tokens to maintain brand consistency.

## Asset Colour Management
- Maintain colour-coded asset manifest `assets-manifest.json` mapping each asset to tokens used for overlays. Example entry:
  ```json
  {
    "asset": "hero-city-grid@2x.jpg",
    "overlay": "--fixnado-gradient-hero",
    "contrast": "7.8:1",
    "lastAudited": "2024-05-20"
  }
  ```
- Photography colour grading handled via LUT `fixnado-brand.cube` applied before export.
- Provide `.gpl` (GIMP) and `.clr` (Apple Color List) palettes for compatibility.

## Governance
- Colour updates require PR touching both `Colours.md` and `colours.md`. Include screenshots demonstrating before/after at 1440 and 768 breakpoints.
- Product marketing to review hero overlays quarterly to align with campaigns.
- Run `pnpm tokens:validate` to ensure tokens not removed accidentally; CI fails if missing entries.
