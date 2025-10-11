# Widget Types Catalogue — Phone Application v1.00

## Buttons
- **Primary Button**: 320×56dp default, radius 16dp, gradient `linear-gradient(135°, #1C62F0 → #4C8DF8)`, elevation 6dp, text `Manrope 16/24` bold, shadow `rgba(20,98,240,0.32)` blur 18dp. Ripple uses `--color-primary-100`.
- **Secondary Button**: Filled with `#0066F5`, height 52dp, radius 14dp.
- **Ghost Button**: Transparent fill, border 1dp `rgba(0,102,245,0.32)`, text `#0066F5`.
- **Destructive Button**: Fill `#E74C3C`, hover/pressed `#C0392B`, text white.
- **Icon Button**: Circular 48dp, background `rgba(12,34,66,0.08)` default; pressed `rgba(12,34,66,0.16)`.

## Navigation Components
- **Bottom Navigation Bar**: 5 items, height 84dp including safe area. Icons 26dp default, 32dp active. Active label `Manrope 12/16` uppercase. Background `#FFFFFF`, top divider `rgba(17,24,39,0.08)` 1dp.
- **Segmented Control**: Container radius 24dp, height 44dp, track `#EEF3FF`, active fill gradient `#1C62F0 → #4C8DF8`, text `Manrope 14/20` medium.
- **Drawer**: Width 296dp, header 180dp with gradient background. List tiles height 56dp, icon 24dp.

## Cards
- **Metric Card**: 160×140dp, radius 20dp, elevation 12, includes icon (24dp), headline (numeric, `IBM Plex Mono 22/28`), label `Inter 13/18`.
- **List Card**: 328×88dp, leading icon 32dp, title `Manrope 16/24`, subtitle `Inter 14/20`, trailing chevron 24dp.
- **Provider Card**: 328×168dp, hero image 96×96dp radius 16dp, rating badge overlay `#1BBF92`. Contains CTA row with two buttons 128×44dp each.
- **Alert Card**: Background `#FEF9C3` for warnings, `#FEE2E2` for danger, left border 6dp corresponding colour tokens.

## Form Elements
- **Text Field**: Height 56dp, fill `#F1F5FF`, border radius 16dp, focus border `#1C62F0` 2dp, icon 20dp. Label `Inter 13/18` uppercase, helper text `Inter 12/16`.
- **Dropdown**: 56dp, trailing caret 16dp, menu items height 48dp.
- **Toggle Switch**: Track 52×32dp, knob 28dp, active fill `#1BBF92`, inactive `#CBD5F5`.
- **Checkbox**: 24dp square with 4dp radius, active fill `#0066F5`, check icon 14dp.
- **Stepper**: Horizontal 4-step indicator height 24dp, dot 12dp, connecting bar 2dp.

## Media & Illustrations
- **Hero Image**: 16:9 ratio, corner radius 24dp. Source from CDN `cdn.fixnado.com/marketplace/v1`.
- **Lottie Container**: Standard 240×240dp, loops thrice max, falls back to static PNG in offline.
- **Map Widget**: 360×340dp default; Mapbox style `fixnado-zones-v10`. Polygons with 2dp border, 32% fill.

## Feedback Widgets
- **SnackBar**: Height 64dp, background `#111827`, text `Inter 14/20` white, icon optional 20dp.
- **Toast**: 320×48dp, radius 16dp, background `rgba(17,24,39,0.85)`, offset 48dp from bottom.
- **Modal Dialog**: 320×260dp, radius 28dp, title `Manrope 18/26`, content `Inter 14/20`, button row with Primary + Ghost.

## Chips & Pills
- **Filter Chip**: Height 36dp, padding horizontal 16dp, background `rgba(12,34,66,0.08)` active `#0066F5`.
- **Status Pill**: Height 28dp, radius 14dp, fill derived from semantic tokens (success `#1BBF92`, warning `#F39C12`, danger `#E74C3C`). Text `Manrope 12/16` uppercase.
- **Badge**: 18×18dp circle, used for notifications with count text `Inter 10/12` bold.

## Loading States
- **Skeleton Block**: Corner radius 16dp, gradient shimmer `rgba(207,217,242,0.6)` to `rgba(207,217,242,0.3)` moving left-to-right over 1.4s.
- **Pull-to-Refresh Indicator**: Custom arc 24dp radius using primary gradient.

## Animations
- Buttons use scale `1.0 → 0.98` on press (100ms).
- Bottom sheets slide in with `Curves.easeOutCubic`, duration 320ms.
- Map filter chips fade+slide from top (offset 16dp) on page load.

## Accessibility Attributes
- Minimum touch target 48×48dp across all interactive widgets.
- VoiceOver hints provided for icon-only buttons; e.g., location pill labelled "Change service location".
- All animated widgets respect `MediaQuery.of(context).disableAnimations` flag.

## Data Visualisation Widgets
- **Progress Donut**: 88dp diameter, stroke 10dp, uses gradient `#1BBF92 → #0EA5E9`. Center numeric label `IBM Plex Mono 20/24`, caption `Inter 12/16` below. Supports partial arcs with animation 400ms easeOut.
- **Sparkline**: 112×32dp overlay in metric cards. Stroke 2dp, uses accent colour by context (`#0066F5` bookings, `#1BBF92` earnings). Shaded area 20% opacity.
- **Bar Indicator**: Horizontal bar 320×12dp for compliance progress. Active segment uses gradient; inactive grey `#E5E7EB`.

## Banners & Informational Widgets
- **Hero Banner**: 360×200dp, background image with dark overlay `rgba(12,18,32,0.64)`, title `Manrope 22/30` white, CTA pill 140×40dp bottom-right.
- **Inline Info Banner**: 328×80dp, left icon 32dp, body text `Inter 14/20`, optional action button 96×36dp ghost style. Colours align with semantic tokens (warning, danger, info `#2563EB`).
- **Coach Mark Tooltip**: 240×120dp card with arrow 16×24dp, drop shadow level 2. Contains title `Manrope 16/24`, body `Inter 14/20`, actions row (Primary + Ghost).

## Navigation Enhancements
- **Top Tab Bar**: Scrollable variant height 48dp, indicator pill radius 16dp thickness 3dp. Active text `Manrope 14/20` medium, inactive `rgba(17,24,39,0.56)`.
- **Stepper**: Vertical stepper for compliance tasks — nodes 24dp circles connected by 4dp line. Active node gradient fill, completed node `#1BBF92`, upcoming node `#CBD5F5`.

## Media Controls
- **Audio Player Mini**: 328×88dp card with thumbnail 56dp, title `Manrope 16/24`, progress bar 240×4dp. Play button 48dp circular gradient.
- **Video Preview Tile**: 328×196dp 16:9 ratio, overlay play icon 48dp. On tap opens full-screen player with controls aligned per platform guidelines.

## Forms Enhancements
- **Inline Tag Input**: Wrap container 328×auto with chips height 32dp, add icon 24dp leading. Each tag chip radius 16dp, background `#EEF3FF`.
- **OTP Input**: 6 cells 48×56dp, border radius 12dp, focus border `#1C62F0` 2dp. Auto-advances on input.
- **Address Autocomplete List**: Modal sheet 360×320dp with list tiles 64dp height, location icon 24dp, highlighted substring bold.
