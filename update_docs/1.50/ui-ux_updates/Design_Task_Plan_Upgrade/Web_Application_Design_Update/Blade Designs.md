# Blade Template Designs

## Master Layout
- Defines global HTML structure with responsive meta tags, root CSS variables, and theming class toggles (`theme-light`, `theme-dark`).
- Includes slots for `top-nav`, `side-rail`, `sub-header`, `content`, and `footer`. Support `@stack('modals')` for overlays.

## Partials & Components
- **Navigation partials:** `partials.nav.main`, `partials.nav.user`, `partials.nav.persona-switcher` for reuse across modules.
- **Feedback components:** `components.alert`, `components.toast`, `components.banner` controlled via Livewire/Vue events.
- **Data components:** `components.card-kpi`, `components.table`, `components.timeline`, `components.form-wizard`.
- **Modal templates:** Standard modal, slide-over, and full-screen viewer with accessible focus traps.

## Conditional Rendering
- Persona-based sections gated via `@can` and `@hasrole` directives; fallback to informative locked states.
- Feature flags integrated using config toggles (e.g., `@feature('ads-campaigns')`).

## Performance & SEO
- Defer non-critical scripts with `@push('scripts')`; inline critical CSS for hero to improve LCP.
- Provide meta tag partial for dynamic titles, descriptions, and structured data (breadcrumbs, product). 

## Accessibility
- Implement skip-link component at top of layout, accessible modals with ARIA roles, and consistent heading hierarchy.
