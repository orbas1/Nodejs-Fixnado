# Marketplace Package Design — Web Application v1.00

## Package Card Structure
- Dimensions: 280×360px desktop, 260×340px tablet, full width mobile.
- Background: hero image with gradient overlay `linear-gradient(180deg, rgba(11,17,32,0.0) 0%, rgba(11,17,32,0.75) 100%)`.
- Content stack bottom aligned: package title `Manrope 22/30`, bullet list `Inter 16/24`, price badge.
- Price badge: pill 80×32px, background `rgba(20,69,224,0.9)`, text white `Inter 600 16/24`.
- CTA button full width 56px height, label "Configure package".

## Package Detail Drawer
- Drawer width 520px (desktop), 420px (tablet), full width mobile.
- Includes hero image 520×220 with overlay, summary metrics (SLA, coverage radius, onsite time), benefits table.
- Tabs: `Overview`, `Included Services`, `Add-ons`, `Testimonials`.
- Add-ons displayed as checklist with price chips 60×32px.

## Pricing Presentation
- Display monthly cost (bold) and hourly equivalent (lighter) for clarity.
- Provide discount badges (e.g., "Save 12% annually") with accent `#FF6B3D`.
- Show ROI metric ("Avg. downtime reduction 37%"), highlight with icon `trending-up`.

## Configurator Flow
1. **Select Package**: choose base package card.
2. **Customise**: choose coverage zones (map multi-select), service level (slider), add-ons.
3. **Review**: summary card with cost breakdown, compliance requirements.
4. **Confirm**: schedule call or direct booking.
- Progress indicator top with 4 steps, 48px circles.

## Data Sources
- Packages from CMS `packages` collection with fields (name, slug, description, price, metrics, assets).
- Add-ons from `GET /add-ons?packageId=`.
- Testimonials filtered by package category.

## Accessibility
- Provide text alternatives for background images (set via `aria-label` on card link).
- Ensure price badge has 4.5:1 contrast with text (use white text, check background brightness).
- Keyboard navigation: entire card focusable with `outline-offset: 4px`; CTA accessible via `tab`.

## Analytics
- Events: `package_viewed`, `package_customised`, `package_addon_selected`, `package_checkout_started`.
- Track time in configurator to identify friction.

## Performance
- Lazy-load package imagery using `next/image` with blur placeholder.
- Prefetch detail drawer content on hover using `prefetchQuery` for associated data.

## Asset Requirements
- Each package requires hero image (4:3), icon (48px), Lottie for highlight (optional) stored in `assets/packages/`.
