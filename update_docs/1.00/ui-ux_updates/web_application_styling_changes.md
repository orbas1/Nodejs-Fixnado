# Web Application Styling Changes

## 1. Design Tokens & Theming
- Introduced CSS variable library `fixnado-theme` with token categories: colour, typography, spacing, elevation.
- Implemented light and dark themes with automatic detection and manual toggle in header.
- Spacing scale uses 4px increments on desktop (4, 8, 12, 16, 24, 32, 48) mapped to `--space-*` tokens.

## 2. Colour Palette
- **Primary**: `#1445E0` (main actions), `#0E33A8` hover, `#09226F` active.
- **Secondary**: `#00B894` for success-driven CTAs, `#009874` hover.
- **Accent**: `#FFB020` for warnings, `#E85A5A` for errors.
- **Backgrounds**: `#F5F7FB` page background, `#FFFFFF` cards, `#0B1120` dark mode background.
- **Border/Divider**: `rgba(17, 24, 39, 0.08)`.
- Zone overlays use semi-transparent fills with 32% opacity and 2px solid outlines.

## 3. Typography
- Primary font `Manrope`; fallback `Inter`, `Segoe UI`, `sans-serif`.
- Display sizes: `H1` 32px/40px, `H2` 28px/36px, `H3` 24px/32px, `H4` 20px/28px.
- Body text `16px/24px`, small text `14px/22px`, micro text `12px/18px`.
- Bold weight for metrics, medium for navigation, regular for body.

## 4. Layout Patterns
- Header height 72px with drop shadow `0 10px 30px rgba(15, 23, 42, 0.08)`.
- Side navigation width 280px expanded, 88px collapsed; uses icon + label with tooltip.
- Cards adopt 16px corner radius, 24px padding, and subtle shadow `0 12px 24px rgba(15, 23, 42, 0.10)`.
- Data tables employ sticky headers and zebra striping using neutral backgrounds.

## 5. Component Styling
- **Buttons**
  - Primary button gradient `linear-gradient(135deg, #1445E0 0%, #3C6BFF 100%)`, focus ring `0 0 0 3px rgba(20, 69, 224, 0.35)`.
  - Secondary button outlined with 2px primary border; ghost button text primary with transparent background.
  - Destructive button filled with error accent, hover darkens by 8%.
- **Inputs**
  - Floating labels, 1px border neutral-200; focus border primary, invalid border error with icon indicator.
  - Textareas use 12px radius, 16px padding.
- **Tabs**
  - Underline indicator 3px high, animated transitions.
- **Pills & Badges**
  - Rounded 999px radius, uppercase text; statuses color-coded to palette.
- **Modals & Drawers**
  - Modal corners 16px, drop shadow `0 24px 48px rgba(9, 17, 32, 0.18)`; overlay 60% opacity.
  - Drawers slide from right with 320px width, responsive to 100% on mobile.
- **Charts**
  - Use gradient fills for primary series, dotted baselines, and tooltip styling with card background.

## 6. Forms & Validation
- Form sections separated by 32px vertical spacing, headings uppercase.
- Error summaries appear at top with anchor links to fields.
- Success messages use secondary colour banner with icon.

## 7. Tables & Data Visualisation
- Table headers uppercase, background `#EEF1F9`; alternating row shading `#FAFBFF`.
- Hover state uses subtle shadow to highlight row.
- Dense mode reduces padding to 12px for admin views.
- Charts integrate accessibility via contrasting colours and text overlays for key metrics.

## 8. Motion Guidelines
- Micro interactions use 200ms transitions with `cubic-bezier(0.4, 0.0, 0.2, 1)` easing.
- Navigation collapse/expand animates width over 250ms.
- Skeleton loaders shimmer with 1.5s gradient animation.

## 9. Accessibility Enhancements
- Focus indicators highly visible (`#FFB020` outline) for keyboard navigation.
- All interactive elements exceed 44px target height on touch devices.
- Dark mode ensures 4.5:1 contrast; charts provide pattern overlays for colour-blind users.
- Added ARIA labels for map controls, filters, and dynamic content.

## 10. Content Guidelines
- Tone professional yet supportive; use concise headings, descriptive tooltips.
- Status alerts follow pattern: icon + bold title + body text + CTA.
- Empty state illustrations use brand palette with minimal text.

These styling adjustments deliver a cohesive, accessible web experience aligned with the expanded Fixnado design system.
