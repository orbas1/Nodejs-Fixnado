# Provider Application Styling Changes

## 1. Brand Palette & Tokens
- **Core Colours**
  - `--color-primary-500` (#1C62F0): Primary action buttons, highlights on dashboards.
  - `--color-primary-600` (#184FD4): Pressed state for primary actions.
  - `--color-secondary-500` (#1BBF92): Positive status indicators (completed jobs, verified documents).
  - `--color-warning-500` (#F39C12): Pending compliance alerts, expiring documents.
  - `--color-danger-500` (#E74C3C): Disputes, rejected submissions.
  - `--color-neutral-050` (#F7F9FC) to `--color-neutral-900` (#111827): Backgrounds and typography.
- **Zone Overlay Tokens**
  - Distinct hues assigned per zone tier (Core, Expansion, Prospective) with 40% opacity fills and 2px outlines.
- **Gradient Usage**
  - Dashboard hero uses `linear-gradient(135deg, #1C62F0 0%, #4C8DF8 100%)` to differentiate from data cards.

## 2. Typography
- **Font Families**
  - Headings: `Manrope` (600/700 weight) for improved clarity on dense dashboards.
  - Body: `Inter` (400/500) for readability, with letter-spacing adjustments (`0.01em`) on small captions.
  - Numeric data: `IBM Plex Mono` (500) for financial figures and IDs.
- **Hierarchy Rules**
  - `H1` 28px/36px, `H2` 24px/32px, `H3` 20px/28px, `Subtitle` 16px/24px, `Body` 14px/22px, `Caption` 12px/18px.
  - All headings maintain bottom margin increments of 16px for consistent rhythm.

## 3. Layout & Spacing
- Adopted 8px base spacing with multiples (8, 16, 24, 32) for padding/margins.
- Cards use 16px padding on mobile, 24px on tablet.
- Bottom navigation height standardised at 72px; FAB offset 16px from edges.
- Section dividers use 1px neutral-200 lines with 16px vertical padding.

## 4. Components
- **Buttons**
  - Primary: Filled, 4px radius, shadow `0 8px 16px rgba(28, 98, 240, 0.24)` on hover (tablet), focus ring `0 0 0 3px rgba(28, 98, 240, 0.24)`.
  - Secondary: Outline with 1.5px border, same radius, text `--color-primary-500`.
  - Tertiary: Text buttons with underline on hover; caution to maintain 44px touch targets.
  - Destructive: Filled danger red with white text; disabled state uses 60% opacity and removes shadow.
- **Cards & Panels**
  - Cards feature 12px radius, subtle border `rgba(17, 24, 39, 0.06)`, drop shadow `0 6px 18px rgba(15, 23, 42, 0.08)`.
  - Kanban cards include color-coded side strip (4px) representing status.
- **Chips & Status Pills**
  - Rounded 16px radius, uppercase text for statuses, icons left-aligned.
- **Forms**
  - Inputs adopt floating labels with 1px neutral-300 border, focus state uses `--color-primary-500` 2px border.
  - Error states display red border and 12px helper text with icon.
- **Tables**
  - Alternating row background neutral-050, header row bold with uppercase labels.
- **Charts**
  - Line charts: Primary gradient fill; bar charts use neutral palette with accent highlights.

## 5. Iconography & Imagery
- Icons sourced from custom Fixnado set, stroke width 1.5px.
- Job status icons include animation microstates (e.g., pulse for urgent).
- Empty states use illustrations with muted colours and actionable copy.

## 6. Motion & Feedback
- Default animation curve `cubic-bezier(0.4, 0.0, 0.2, 1)` with 200–250ms durations.
- Haptics triggered on job status changes (success, warning) using medium impact feedback.
- Toast notifications slide in from bottom with 400ms fade, auto-dismiss after 5s.

## 7. Accessibility & Theming
- Dark mode variant introduced: backgrounds `#0B1120`, text `#E5E7EB`, primary lighten to `#3B82F6` for contrast.
- High contrast mode uses thicker borders (2px) and removes gradient backgrounds to support clarity.
- Colour-blind safe palette adjustments ensure no critical information relies solely on colour; icons supplement status cues.

## 8. Content Styling
- Microcopy uses sentence case, avoids jargon; tooltips limited to 80 characters.
- Alerts adopt structured layout: icon, bold title, descriptive body, action button.
- Checklist items use bullet toggles with strikethrough on completion.

## 9. Platform-specific Adjustments
- iOS: Utilises native bounce scrolling and respects safe area insets around FAB.
- Android: Material ripple effects align with theme colours; status bar tinted primary for top-level screens.
- Tablet: Multi-column layouts use 24px gutters; modal widths capped at 720px.

These styling changes reinforce the professional tone of the provider app while improving clarity, accessibility, and consistency with the broader Fixnado design system.
