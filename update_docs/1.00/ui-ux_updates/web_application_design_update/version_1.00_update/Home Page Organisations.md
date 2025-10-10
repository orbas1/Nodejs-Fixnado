# Home Page Information Architecture — Web Application v1.00

## Layout Structure (Desktop 1440×900)
1. **Hero Band (0–480px)**
   - Full-width background hero (map overlay). Height 480px.
   - 12-column grid. Content spans columns 2–8. Right column 9–12 hosts KPI pill stack.
   - CTA stack: primary button (Book coverage) width 220px, secondary ghost button width 160px.
2. **Zone Explorer Preview (480–760px)**
   - Split panel (map preview left 60%, list right 40%). 24px top margin.
   - 3 cards summarising top zones (card width 320px, height 200px).
3. **Marketplace Offerings (760–1040px)**
   - Four cards per row (280×360px). Title row with filter pills.
   - Background tinted `rgba(20,69,224,0.04)`.
4. **Testimonials & Logos (1040–1240px)**
   - Carousel height 220px. Contains partner logos (120×60px) and quotes.
5. **Knowledge Hub (1240–1480px)**
   - Two-column article list (cards 560×220px). Right column hosts newsletter sign-up form.
6. **Footer (1480–1600px)**
   - 4-column layout: Company, Marketplace, Support, Legal. Social icons row (24px) below.

## Tablet (1024×768)
- Hero height 400px, CTA stack center aligned.
- Zone preview map collapses to top (100% width) with cards in horizontal scroll (card width 260px).
- Marketplace grid 2 columns.
- Footer columns stack into 2×2 grid.

## Mobile (375×812)
- Hero height 360px, text center aligned, CTA stacked vertical with 16px gap.
- Quick action chips (scroll horizontal) 48px height.
- Marketplace cards full width, 16px margin.
- Testimonials convert to stacked quotes with 16px padding.
- Footer collapses to accordion sections.

## Content Hierarchy
1. Value proposition (hero heading, subheading, CTA).
2. Zone availability preview (map + top zones list).
3. Marketplace offerings (packages, promotions).
4. Social proof (testimonials, logos).
5. Learning resources + newsletter.
6. Footer navigation & compliance links.

## Interaction Highlights
- Hero CTA triggers command palette for quick booking or scrolls to zone section (smooth scroll 600ms).
- Zone cards open Explorer route `/explorer?zoneId=XYZ` in new tab on ctrl+click.
- Marketplace cards support hover (lift + shadow) and open detail modal.
- Newsletter form inline validation, success message with green highlight.

## Accessibility
- Provide skip link to jump hero → zone preview.
- Ensure hero background has overlay to maintain text contrast (target 7:1).
- All carousels accessible via keyboard (arrow keys, focus loops).

## Data Sources
- Hero metrics from analytics API (`GET /metrics/highlights`).
- Zone preview cards from `GET /zones?sort=demand&limit=3`.
- Marketplace products from `GET /packages?featured=true`.
- Testimonials stored in CMS with credit (name, role, company).

## Asset Requirements
- Hero background: Mapbox static image 1600×900 exported to `/public/assets/hero/hero-map@2x.jpg`.
- Logos: SVG from `assets/logos/partners/` sized 120×60.
- Testimonials: Portraits 80×80 circle, stored in `assets/people/`.
