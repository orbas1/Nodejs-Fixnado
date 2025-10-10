# User Application Styling Changes

## 1. Visual Identity
- **Colour Palette**
  - Primary: `#0066F5` (actions, active navigation icons), Darker hover `#0052C4`.
  - Secondary: `#FF6B3D` for promotional highlights and urgent calls to action.
  - Success: `#2ECC71`, Warning: `#F1C40F`, Danger: `#E74C3C`.
  - Background gradients in Explore hero: `linear-gradient(160deg, #0066F5 0%, #00AEEF 100%)`.
  - Neutral scale from `#F9FBFD` to `#1F2937` for text/background.
- **Illustration Style**
  - Rounded vector shapes with soft shadows, aligning with friendly consumer tone.

## 2. Typography
- `Inter` remains primary font across headings and body for consistency.
- Headings: `H1` 26px/34px, `H2` 22px/30px, `H3` 18px/26px.
- Body text 15px/22px; captions 13px/20px.
- Emphasis uses semi-bold weight; avoid italics for readability.

## 3. Layout & Spacing
- 8px spacing grid with responsive breakpoints: small (8), medium (16), large (24).
- Explore map screen uses edge-to-edge layout; overlays maintain 16px margin from screen edges.
- Booking wizard uses card container with 24px padding and stepper indicator at top.
- Form elements spaced 12px vertically; groupings separated by 24px.

## 4. Components
- **Navigation Bar**
  - Icons 24px, labels 12px uppercase; active tab uses filled icon and pill indicator.
- **Search Bar**
  - Rounded 24px corners, subtle shadow `0 10px 30px rgba(0, 40, 120, 0.12)`, voice icon on right.
- **Cards**
  - Provider cards: 16px radius, drop shadow `0 16px 32px rgba(15, 23, 42, 0.12)`, includes status chips and rating badge.
  - Marketplace product cards include overlay ribbon for insurance status.
- **Buttons**
  - Primary buttons 52px height, 8px radius, gradient fill matching hero.
  - Secondary outline buttons use 2px primary border; ghost buttons for tertiary actions.
- **Stepper**
  - Booking steps displayed as numbered circles connected by progress line; active step filled with primary colour.
- **Chips**
  - Filter chips pill-shaped, 1px border, icon inside; selected state filled with primary 10% tint.
- **Modals & Sheets**
  - Rounded top corners (24px) for bottom sheets; drag handle indicator.

## 5. Imagery & Media
- Gallery images use aspect ratio 4:3 with rounded corners.
- Video thumbnails include play button overlay with drop shadow.
- Placeholder images use gradient backgrounds with icon overlays.

## 6. Motion & Feedback
- Page transitions slide-in from right (forward) and left (back) with 250ms duration.
- Map interactions include subtle zoom easing to avoid abrupt shifts.
- Button presses trigger scale-down 96% micro-animation with haptic feedback.
- Toast notifications appear at top with fade/slide animation.

## 7. Accessibility
- Text contrast meets WCAG AA (minimum 4.5:1); icons accompanied by labels.
- Dynamic type supported; layout adjusts up to 140% font scaling.
- Focus indicators added for keyboard interactions (Android accessibility, external keyboards).
- VoiceOver labels clarify context (e.g., "Booking status: En Route").

## 8. Content & Microcopy
- Tone friendly and reassuring; emphasise transparency on pricing and provider vetting.
- Key CTAs use action verbs ("Confirm Booking", "Track Order", "Chat with Provider").
- Error messages specify resolution steps ("Update card details" rather than generic failure).

## 9. Dark Mode
- Background `#0F172A`, cards `#1E293B`, text `#E2E8F0`.
- Primary colour shifts to `#3B82F6` for contrast; secondary toned to `#FB8C61`.
- Shadows reduced; rely on border outlines `rgba(255,255,255,0.08)`.

These styling updates deliver a polished consumer experience while aligning with the broader Fixnado brand language introduced in Version 1.00.
