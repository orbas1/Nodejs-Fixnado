# Provider Application Styling Changes (v1.50)

## Colour Palette
- Core palette aligned to shared design tokens: **Primary Indigo 600 (#3F51B5)** for CTAs, **Accent Amber 500 (#FFB300)** for alerts, **Success Teal 500 (#26A69A)** for positive states, and **Error Crimson 600 (#C62828)** for critical messaging.
- Neutral ramp expanded to 10 steps for better layering (Gray 25 → Gray 900) ensuring contrast ratios exceed 4.5:1 for text on surfaces.
- Introduced semantic colour roles (Action, Info, Warning, Success, Muted) to allow future theming without rewriting component-level styles.

## Typography & Spacing
- Migrated to **Inter** for primary UI text with weights 400/500/600; headings adopt **Manrope** 600 for improved readability in dashboards.
- Established responsive type scale (12/14/16/18/20/24/32) with auto line-height tokens for dense data tables vs. marketing panels.
- Vertical rhythm now locked to 4px baseline grid with macro spacing tokens (XS 8px → 2XL 40px). Cards and modals adhere to consistent padding (24px horizontal, 20px vertical).

## Components & States
- Buttons: redefined ghost and tertiary variants with subtle border, hover elevation, and high-contrast focus ring; destructive state uses tinted background to avoid colour-only signaling.
- Forms: input fields adopt filled background with 2px border; error states include icon, helper text, and accessible `aria-describedBy` references.
- Cards: apply elevation level 1 default, elevate to level 3 on hover for interactive cards; add optional status stripe for compliance alerts.
- Tabs: redesigned with pill indicator, 16px padding, and animated underline to clarify active tab in job detail views.

## Imagery & Iconography
- Introduced illustrated onboarding banners styled in flat vector language with provider-specific scenarios; ensure exported at 3x for retina clarity.
- Updated icon set to use 24px stroke icons with consistent corner radius; new icons for Action Queue, Compliance, and Receipt Scan added to library.
- Avatar placeholders replaced with initial-based gradients matching provider brand colour selection.

## Interaction Feedback
- Motion reduced to 150–200ms easing for panel transitions to maintain snappy feel; skeleton placeholders used for loading states longer than 400ms.
- Toast notifications positioned above bottom navigation with slide-in animation; accessible dismiss via swipe or close button.
- Haptic feedback patterns defined for core actions (task complete, error) with short medium pulses following platform guidelines.

## Accessibility & Theming
- High-contrast mode inherits same structural styles but swaps to higher-luminance tokens; icons gain 2px outlines to increase visibility.
- Dynamic type support verified up to 130%; layout gracefully shifts to stacked patterns when fonts scale beyond baseline.
- Dark mode preview wireframes note use of desaturated palette to preserve brand recognition while meeting contrast ratios.
