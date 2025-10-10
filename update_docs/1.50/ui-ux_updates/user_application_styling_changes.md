# User Application Styling Changes

## Palette & Themes
- **Primary:** Royal Blue (#1E3A8A) emphasises trust on CTAs and headers.
- **Secondary:** Coral (#FF6B6B) highlights promotional banners and urgent alerts.
- **Support:** Light Sky (#E8F2FF), Warm Grey (#F3F4F6), Charcoal (#1F2933).
- **Status Chips:**
  - Confirmed: Emerald (#2AA876)
  - Pending: Amber (#F59E0B)
  - Cancelled: Crimson (#DC2626)

## Typography & Iconography
- Headlines: Poppins SemiBold (30/24/20px) for friendly, modern tone.
- Body: Inter Regular (16px) with 150% line-height; secondary text 14px.
- Icons: Rounded 24px line icons, consistent stroke width (1.75px) for clarity.

## Component Enhancements
1. **Cards**
   - Provider cards adopt layered depth with 8dp elevation, hero image, rating cluster, compliance badge overlay.
   - Rental cards include availability calendar preview and deposit chip.
2. **Buttons**
   - Primary: Filled Royal Blue with gradient accent on hover/tap.
   - Secondary: Ghost style with Royal Blue border; expands to full width on smaller devices.
   - Tertiary: Text button with arrow icon for "View details" interactions.
3. **Forms**
   - Stepper styled with progress dots and titles; active step highlighted Coral.
   - Input fields have soft shadows, 10px radius, placeholder text in Warm Grey.
4. **Messaging**
   - Chat bubble colours differentiate participants; provider messages in Blue tint, user in Grey, AI tips in Indigo (#6366F1).
   - Rich media thumbnails have rounded corners and drop shadow for depth.
5. **Maps & Tracking**
   - Map overlays use soft Blue gradient for route, anchor markers with service icon.
   - ETA pill anchored bottom centre with high-contrast typography.

## Accessibility & Motion
- CTAs meet 4.5:1 contrast; texts scale gracefully due to auto-layout.
- Reduced motion disables shimmer on skeleton loaders; fallback to fade-in.
- Haptic feedback on booking confirmation, push for rating submission.
