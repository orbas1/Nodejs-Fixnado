# Profile Page Styling Tokens — Web Application v1.00

## Colour Usage
- Header overlay: `linear-gradient(135deg, rgba(11,17,32,0.82) 0%, rgba(20,69,224,0.6) 100%)`.
- Avatar border: `#FFFFFF`, drop shadow `0 12px 32px rgba(12,18,32,0.24)`.
- Tab active: `#1445E0` underline 4px, background `rgba(20,69,224,0.08)`.
- Metric cards: background `#FFFFFF`, border `1px solid rgba(79,70,229,0.12)`, icons tinted `#1445E0`.

## Typography
- Name: `Manrope 600, 32px / 40px` (desktop), `28/36` (tablet), `24/32` (mobile).
- Role & company: `Inter 500, 18/28`, colour `#4B5563`.
- Section headings: `Manrope 600, 24/32`, uppercase label `Inter 600, 12/16, letter-spacing 0.2px`.
- Body text: `Inter 400, 16/24`, review comments `Inter 400, 15/24` for readability.

## Spacing
- Header bottom padding 48px to offset avatar.
- Section spacing: 48px top, 32px bottom.
- Cards internal padding: 24px desktop, 20px tablet, 16px mobile.
- Review list spacing: 24px between items, 16px for mobile.

## Components Styling
- **Contact Card**: radius 16px, drop shadow level 1, button full width 56px height.
- **Accordion**: border bottom `1px solid rgba(148,163,184,0.3)`, plus icon 20px rotate animation 160ms.
- **Metric Gauge**: ring thickness 12px, gradient `#1445E0 → #0EA5E9`, background track `rgba(20,69,224,0.16)`.
- **Review Stars**: `fill: #FFB020`, star size 20px; half stars use mask.

## Responsive Adjustments
- Tablet: convert metrics row to two columns (each 50% width). Contact card moves below metrics.
- Mobile: convert tabs to horizontal scroll, add drop shadow `0 8px 16px rgba(12,18,32,0.1)` to differentiate.
- Buttons full width on mobile with 16px margin.

## Accessibility
- Focus states: `outline: 3px solid #0EA5E9` for tabs and accordions.
- Provide `aria-expanded` on accordion toggles with icon rotation toggled via CSS `[aria-expanded="true"] { transform: rotate(180deg); }`.
- Ensure star ratings accompanied by text ("Rated 4.8 out of 5").

## Dark Mode Overrides
- Background surfaces `#0F172A`, text `#E2E8F0`.
- Avatar border `rgba(148,163,184,0.6)` to avoid glare.
- Cards background `#111C33`, border `rgba(148,163,184,0.24)`.

## Asset Handling
- Cover images stored with `object-fit: cover`, `object-position: center`.
- Avatar uses `picture` element to serve WebP/PNG fallback, 2x retina size.
