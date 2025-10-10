# Screen Size Adaptations

| Breakpoint | Layout Adjustments | Interaction Notes |
| --- | --- | --- |
| ≥1440px (XL Desktop) | Increase max-width to 1280px content, allow dual context panels (AI + Support). Charts display extended legends. | Enable hover tooltips with additional metrics; maintain keyboard shortcuts. |
| 1200-1439px (Desktop) | Standard 12-column grid, side rail fixed, context panel visible. | Provide sticky filters and maintain 24px padding. |
| 1024-1199px (Small Desktop) | Reduce gutter to 20px, collapse some card sets into carousels. Side rail collapses to icon rail. | Offer quick access menu for hidden modules. |
| 768-1023px (Tablet) | Switch to 8-column grid, hide context panel behind toggle, convert tables to condensed mode. | Drag gestures for carousels; provide alternative controls for keyboard. |
| 480-767px (Large Mobile) | Stack sections vertically, convert nav to top bar + bottom sheet for modules. | Primary CTAs become full-width; use accordion filters. |
| <480px (Mobile) | Single-column layout, simplified hero, charts replaced with summary cards. | Hide heavy imagery, provide offline messaging and quick dial buttons. |

- Implement responsive typography scale: reduce headings by one size on tablet/mobile.
- Ensure modals convert to full-screen overlays on mobile with close button anchored top-right.
