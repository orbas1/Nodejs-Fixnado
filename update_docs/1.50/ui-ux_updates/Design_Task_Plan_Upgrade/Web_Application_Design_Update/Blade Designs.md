# Blade Template Design Guidelines

## Overview
- Standardise Laravel Blade templates powering marketing and authenticated web pages to reflect updated layout and styling tokens.

## Template Structure
- **Base Layout (`layouts/app.blade.php`)**
  - Includes global header, footer, notification centre container, and design token CSS variables.
  - Supports dynamic breadcrumb slot and contextual side navigation.
- **Dashboard Template (`layouts/dashboard.blade.php`)**
  - Extends base layout; injects dock navigation, page title section, KPI grid slots.
  - Contains placeholders for filters and toolbar actions.
- **Marketing Template (`layouts/marketing.blade.php`)**
  - Hero section, CTA blocks, testimonial carousel, FAQ accordion.
  - Configurable per page via JSON front matter.

## Component Partials
- `components/nav/header.blade.php`: Accepts navigation array, handles active state and responsive collapse.
- `components/cards/metric.blade.php`: Renders KPI cards with icon, value, delta, tooltip.
- `components/forms/stepper.blade.php`: Multi-step wizard container with progress indicator and validation summary slot.
- `components/modals/sheet.blade.php`: Standard bottom sheet for actions, supports size modifiers.

## Styling Integration
- Use tailwind/utility classes referencing CSS variables for colour and spacing to ease theming.
- Ensure components accessible with ARIA attributes and keyboard navigation.

## Performance Considerations
- Lazy-load modules via `@stack('scripts')` placement; include critical CSS inline for above-the-fold sections.
- Optimise includes to prevent duplicate queries; document caching strategies for repeated partials.

## Testing
- Establish Blade screenshot tests using Laravel Dusk for key templates to catch regressions.
