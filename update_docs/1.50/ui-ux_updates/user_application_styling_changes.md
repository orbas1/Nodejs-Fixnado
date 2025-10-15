# User Application Styling Changes (v1.50)

## Palette & Visual Language
- Adopt shared brand palette with gradient hero treatments blending **Primary Blue 500 (#1E88E5)** and **Secondary Violet 500 (#7E57C2)**; ensures parity between marketing and in-app experiences.
- Support semantic colour tokens for booking statuses: Confirmed (Blue 600), In Progress (Amber 500), Completed (Teal 500), Attention (Red 500), enabling consistent badges and timelines.
- Introduce background surface layers (Surface 0/1/2) with subtle tints to differentiate cards, drawers, and modals without heavy borders.

## Typography & Content Density
- Primary typeface updated to **Inter** 400/500 for body text, **Manrope** 600 for titles; accessible fallback stack defined ("Inter", "Manrope", "Helvetica", sans-serif).
- Responsive type scale: 13/15/17 body sizes with 1.4 line-height; display headings 28/32 for hero sections, 20/22 for section headings, 18 for card titles.
- Content guidelines specify maximum 60 characters per line for paragraphs and encourage action verbs in button labels (e.g., "Review Booking", "Upload Site Plan").

## Components & Interaction States
- Buttons: elevated primary button uses gradient fill on hero screens, flat solid style within flows; focus ring 2px accent for accessibility. Secondary buttons adopt outline with 16px corner radius.
- Inputs: apply filled background with 8px radius; placeholder text greyed at 60% opacity; success state uses subtle green border.
- Cards: 16px corner radius, drop shadow level 2, optional status bar. Expandable cards animate height transitions at 180ms with ease-in-out curves.
- Chips & tags: pill shape with uppercase labels for statuses, lowercase for filters; ensure 12px horizontal padding to maintain readability.

## Imagery & Illustrations
- Onboarding illustrations updated to depict jobsite scenarios with inclusive representation; exported at 2x/3x densities and compressed under 80kb.
- Booking confirmation hero uses animated checkmark lottie file (<120kb) to celebrate completion; includes fallback static asset for low-end devices.
- Knowledge base cards incorporate iconography that matches article categories (Safety, Logistics, Billing) using consistent stroke weight.

## Motion & Feedback
- Screen transitions adopt native navigation patterns with 200ms duration; modals slide up from bottom with overshoot suppressed to reduce motion sickness.
- Loading states rely on skeleton placeholders for lists and shimmering progress bars for timeline updates; avoid spinner loops longer than 8 seconds.
- Toast notifications appear top-right with auto-dismiss after 6 seconds; accessible alternative ensures screen reader announces context and action.

## Accessibility Considerations
- Dynamic text support tested up to 200%; key screens reflow to vertical stacks and maintain padding to avoid clipping.
- VoiceOver labels added for quick action buttons and map annotations; ensures booking timeline accessible without visual cues.
- Colourblind-safe palette validated using simulators; status differences also conveyed via icons and text.

## Compliance Operations Styling
- Warehouse export run cards use compliance green (`#1AAE70`) for successful states, amber (`#FFB300`) for in-progress, and crimson (`#D32F2F`) for failures, with matching iconography to maintain clarity for colourblind operators.
- Retention countdown chips adopt mono-spaced numerals with 12px padding and gradient borders referencing the shared audit token to visually differentiate them from generic badges.
- DPIA guidance drawer integrates legal typography styles (Manrope 500 headings, Inter 400 body) and uses muted slate backgrounds so compliance copy remains legible during extended review sessions.
