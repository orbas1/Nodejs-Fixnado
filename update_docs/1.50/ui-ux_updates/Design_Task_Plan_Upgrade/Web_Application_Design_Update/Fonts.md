# Web Fonts

| Usage | Typeface | Weights | Size/Line Height | Notes |
| --- | --- | --- | --- | --- |
| Display Headlines | IBM Plex Sans | SemiBold | 48/56, 40/48 | Used on hero and campaign banners; support letter-spacing -1% |
| Section Headings | IBM Plex Sans | Bold | 32/40, 28/36 | Align to grid baseline; accessible skip links anchored |
| Body Copy | IBM Plex Sans | Regular | 18/28, 16/24 | Default text for paragraphs, tooltips, and helper copy |
| Data Labels | IBM Plex Mono | Regular | 14/20 | KPIs, tables, and chart axes; align decimals |
| Buttons & Chips | IBM Plex Sans | SemiBold | 16/20 | Uppercase for primary CTAs; maintain min 48px height |
| Captions & Meta | IBM Plex Sans | Medium | 14/20, 12/16 | Timestamp, legal microcopy, inline validation |

## Typographic System
- Responsive type scale uses modular ratio 1.25; tokens defined as `font-size-xxxl`…`font-size-xs`.
- Provide fallback stack `"IBM Plex Sans", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif` and `"IBM Plex Mono", "SFMono-Regular", Consolas, monospace`.
- Enable automatic number formatting for currencies and percentages within analytics modules.
- Use hyphenation for long legal text blocks and maintain 70–85 characters per line for readability.
