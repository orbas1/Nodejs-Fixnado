# Blade Section Designs — Web Application v1.00

> "Blades" refer to modular marketing slices that can be rearranged on marketing pages (landing, solutions, industry pages).

## Blade Catalogue
| Blade Name | Purpose | Height | Components | Notes |
| --- | --- | --- | --- | --- |
| Hero Blade | Primary message & CTA | 480px desktop, 360px mobile | HeroBanner, SearchBar, KPI Chips | Map background, gradient overlay |
| Feature Blade | Showcase benefits | 480px | IconCard grid (3×) | Cards 360×240, icons 48px |
| Zone Snapshot Blade | Display key zones | 420px | Map preview, zone cards | Supports slider variant |
| Testimonial Blade | Social proof | 260px | Carousel, Quote cards | Quote width 480px |
| Metrics Blade | Quantitative proof | 320px | Metric tiles, sparkline chart | Background gradient |
| CTA Blade | Secondary call-to-action | 280px | Headline, supporting text, CTA buttons | Solid brand colour background |
| Resource Blade | Knowledge resources | 420px | Article cards, newsletter form | Form width 320px |

## Spacing & Dividers
- Between blades: 80px desktop, 64px tablet, 48px mobile.
- Insert gradient divider `linear-gradient(90deg, rgba(20,69,224,0.12) 0%, rgba(14,165,233,0.08) 100%)` height 1px.
- Provide optional angled divider (clip-path) for hero → feature transition (angle 6°).

## Animation Guidelines
- On scroll, blades fade up (`opacity 0 → 1`, `translateY(40px → 0)`, duration 420ms, delay 80ms between cards).
- Reduce motion honours `prefers-reduced-motion` to skip animations.

## Content Flexibility
- Each blade accepts `layout=left|right|center` prop to change alignment.
- Content managed through CMS, enabling reorder without code deployment.
- Provide default copy slots and fallback imagery for each blade in `assets/blades/` directory.

## Accessibility
- Ensure headings follow semantic order; when reordering blades, maintain `h2` for new sections.
- Provide ARIA labels for carousels and map previews.
- CTA blade includes descriptive link text (avoid "Click here").

## Implementation Notes
- Each blade implemented as React component exported from `@fixnado/web-marketing`.
- Use CSS container queries to adjust internal layout depending on width (≥960px two-column, <960px stacked).
- Provide Storybook stories for each blade variant (light/dark backgrounds, with/without imagery).
