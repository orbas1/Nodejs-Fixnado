# Asset Inventory Plan

## Objectives
- Catalogue all visual assets required for web application release including photography, illustrations, icons, and downloadable resources.
- Ensure assets optimised for responsive breakpoints and accessible in shared repository.

## Asset Categories
1. **Hero Photography** – Industrial scenes with overlay gradient; supply desktop (1440px), tablet (1024px), mobile (768px) crops.
2. **Illustrations** – Marketplace hero, onboarding sequences, empty states, onboarding checklists.
3. **Iconography** – 24px line icons for navigation, 20px for table headers, 16px for tags/badges; align with product icon set.
4. **Charts & Data Visuals** – Exportable SVG chart templates with placeholder data for prototypes.
5. **Downloadable Resources** – PDF templates, CSV sample files, marketing collateral thumbnails.

## Production Guidelines
- Maintain consistent colour usage per design tokens; provide dark mode variants.
- Optimise assets under 150kb for hero images (webp), 50kb for icons/illustrations.
- Provide alt text recommendations for imagery to support accessibility.

## Storage & Versioning
- Store in `Design/Assets/v150/web/` with naming convention `page_component_variant@2x`.
- Use version control (Figma library + Git LFS for large files) to track updates.
- Document licence details for stock photos and ensure compliance.

## Delivery Checklist
- [ ] Assets exported in required formats (SVG, PNG, WEBP).
- [ ] Dark mode variants reviewed.
- [ ] Accessibility metadata (alt text, captions) documented.
- [ ] Usage guidelines linked in Confluence.
