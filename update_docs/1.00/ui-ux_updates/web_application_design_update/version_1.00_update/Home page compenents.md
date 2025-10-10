# Home Page Component Breakdown — Web Application v1.00

## Component Inventory
| Section | Component | Dimensions | Behaviour | Notes |
| --- | --- | --- | --- | --- |
| Hero | `HeroBanner`, `SearchBar`, `KpiChipGroup` | Banner 1440×480, search 640×64, chips 160×48 | Search auto-suggest with 300ms debounce | Chips show real-time metrics |
| Zone Preview | `MiniMap` + `ZoneCard` | Map 720×280, cards 320×200 | Card hover syncs to map highlight | Map uses Canvas layering |
| Marketplace | `PackageCard`, `FilterPills` | Cards 280×360 | Filter pills change layout via CSS grid reflow | Cards include gradient overlay |
| Testimonials | `Carousel`, `TestimonialCard` | Carousel height 220 | Auto-play 6s, pause on hover | Cards animate fade/slide |
| Knowledge Hub | `ArticleCard`, `NewsletterForm` | Article 560×220, form 360×220 | Form uses inline validation + success state | Article cards have reading time badges |
| Footer | `FooterColumn`, `LanguageSelector`, `SocialIconList` | Columns min 200px | Language selector dropdown width 220 | Social icons 24px with focus ring |

## Component States
- `SearchBar`: default (placeholder), focus (shadow level 2, highlight), loading (spinner), error (border `#E85A5A`), disabled.
- `KpiChip`: default (background `rgba(20,69,224,0.12)`), hover (background `rgba(20,69,224,0.2)`), active (solid `#1445E0`, text white).
- `ZoneCard`: default, hover (lift 6px, border `#1445E0`), selected (persist highlight, `Open zone overview` button visible), disabled (grayscale imagery).
- `PackageCard`: default gradient overlay, hover reveals CTA bar, focus outlines accessible.

## Data Binding
- `SearchBar` uses `/search?q=` endpoint with `type=zone` filter.
- `MiniMap` obtains data from `GET /zones/featured`. Each zone includes GeoJSON polygon and metrics for tooltips.
- `PackageCard` data from CMS `packages` collection including icon references.

## Loading Skeletons
- Hero: skeleton gradient overlay with placeholder search bar.
- Zone preview: skeleton cards (gray rectangles) with shimmer.
- Marketplace: 4 placeholder cards with pulsing gradient.

## Analytics Events
- `hero_search_submitted`
- `zone_card_opened`
- `package_card_configure`
- `testimonial_scrolled`
- `newsletter_submitted`
Each event includes context: { zoneId, packageId, position, locale }.

## Accessibility
- Provide `aria-expanded` on search suggestions.
- Carousel labelled with `aria-roledescription="carousel"`, include controls labelled "Previous testimonial", "Next testimonial".
- Newsletter form inline errors with `aria-live="assertive"`.

## Implementation Dependencies
- `HeroBanner` styled via `styled-components`; `MiniMap` uses Mapbox GL JS with simplified style for performance.
- Carousel uses `keen-slider` library (import version 6). Provide fallback static stack if JS disabled.
- Newsletter form posts to `POST /newsletter/subscribe` with CSRF token.
