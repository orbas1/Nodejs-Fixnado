# Typography Specification — Phone Application v1.00

## Font Families
- **Headlines**: `Manrope` (weights 700, 600).
- **Body & UI**: `Inter` (weights 400, 500, 600).
- **Numeric / Code**: `IBM Plex Mono` (weight 500) for financials, IDs.

## Type Scale (Base viewport 360×780dp)
| Token | Font | Size / Line Height | Usage |
| --- | --- | --- | --- |
| `display-lg` | Manrope 700 | 30 / 40 | Rare hero headings (onboarding) |
| `display-md` | Manrope 600 | 26 / 34 | Section hero titles |
| `title-lg` | Manrope 600 | 22 / 30 | Card headings, modal titles |
| `title-md` | Manrope 600 | 20 / 28 | Section headings |
| `title-sm` | Manrope 600 | 18 / 26 | Form section titles |
| `body-lg` | Inter 500 | 16 / 24 | Primary body text |
| `body-md` | Inter 400 | 15 / 22 | Supporting text, button labels |
| `body-sm` | Inter 400 | 14 / 20 | Captions, list subtitles |
| `caption` | Inter 500 | 13 / 18 | Chip text, helper labels |
| `micro` | Inter 500 | 12 / 16 | Badge text, overlines |
| `numeric-lg` | IBM Plex Mono 500 | 24 / 28 | KPI metrics |
| `numeric-md` | IBM Plex Mono 500 | 18 / 24 | Table values |

## Accessibility
- Support dynamic type scaling up to 130%. Maintain min line height +4dp vs font size to preserve readability.
- Use `TextHeightBehavior` to align to baseline grid.
- Provide `semanticsLabel` when truncation occurs.

## Implementation Notes
- Register fonts in Flutter `pubspec.yaml` referencing `assets/fonts/{Manrope,Inter,IBMPlexMono}`.
- Use `ThemeData.textTheme` overrides with extension `FixnadoTextTheme` for tokens above.
- For numeric text ensure `TextStyle.fontFeatures` includes `tabular-nums` for aligned digits.
- Apply letter spacing adjustments: display styles `0%`, titles `0.15%`, body `0%`, caption `0.4%` to optimise legibility.
- Provide `TextTheme` getters for condensed variants used in navigation labels (`Manrope 12/16` uppercase, letter spacing 0.8%).

## Localization Considerations
- Provide Noto Sans fallback for languages not covered by primary fonts.
- For RTL languages, maintain same type scale; ensure digits follow locale numbering (use `NumberFormat`).
- Chinese/Japanese/Korean fallback: use `Noto Sans CJK` with adjusted font metrics (line height +2dp) to prevent clipping.
- Arabic script: use `Cairo` font with weight mapping (Manrope 600 → Cairo 600) to maintain hierarchy.
