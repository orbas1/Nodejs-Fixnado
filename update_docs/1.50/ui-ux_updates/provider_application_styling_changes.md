# Provider Application Styling Changes

## Design Tokens & Colour System
- **Primary Palette:** Deep Navy (#10243C) for headers and CTA backgrounds, complemented by Aqua (#2EC4B6) for active states and compliance success badges.
- **Support Neutrals:** Cloud (#F5F7FA), Slate (#708090), Charcoal (#2A2A2A) for typography and separators.
- **Status Colours:**
  - Success: Emerald (#2AA876)
  - Warning: Amber (#F4B740)
  - Error: Crimson (#D7263D)
  - Info/AI Suggestion: Electric Indigo (#5D3FD3)

## Typography
- **Display / Heading:** Sora SemiBold (32/28/24px) with 120% line-height for key stats.
- **Body:** Inter Regular (16px, 150% line-height) to maximise readability.
- **Caption:** Inter Medium (13px) for metadata (zone tags, compliance dates).
- **Numerical Data:** Tabular variant of Inter for KPIs, ensuring alignment in analytics widgets.

## Components & Styling Adjustments
1. **Cards & Tiles**
   - Elevated (4dp) with 12px radius and subtle border (#E0E6ED).
   - Job cards integrate colour-coded zone chips and micro-icons for rental vs. service vs. custom job types.
2. **Navigation**
   - Bottom nav replaced by segmented top tabs with indicator highlight (Aqua) and muted icons for unselected state.
   - Drawer menus adopt gradient background transitioning from Navy to Slate to emphasise depth.
3. **Buttons**
   - Primary buttons: filled Navy with white text, drop shadow on press.
   - Secondary: outline Aqua with 2px border, transitions to filled on hover/tap hold.
   - Destructive: Crimson with full-width alignment on destructive confirmations.
4. **Forms & Inputs**
   - Floating labels with accent underline; error states shake lightly and display inline guidance.
   - Multi-select chips for zones styled with pill edges and icon toggles.
5. **Charts & Analytics Widgets**
   - Sparklines use gradient fill (Aqua to Indigo) on dark backgrounds.
   - Heatmap legend anchored to bottom with accessible contrast ratios.
6. **Messaging**
   - Chat bubbles adopt card styling with AI responses tinted Indigo and containing "AI" badge.
   - Agora call buttons circular with glow effect indicating availability.

## Accessibility & Motion
- Ensured 4.5:1 contrast on primary text and 3:1 on large headings.
- Motion reduced settings disable parallax on dashboard hero and animate focus ring instead.
- Touch targets increased to 48x48px; haptics triggered on key actions (bid submission, compliance updates).
