# Fixnado Version 1.00 – Design Change Log

## Overview
Version 1.00 converts Fixnado from a mistaken learning layout into an enterprise marketplace experience. The design programme introduces the timeline hub styling, commerce dashboards, and mobile parity while eliminating course/instructor remnants.【F:docs/updates/1.00/new_feature_brief.md†L3-L126】【F:docs/updates/1.00/features_update_plan.md†L66-L111】

## Global Updates
- **Design System Refresh:** Establish a component library with enterprise typography, spacing, grids, elevation, and colour usage consistent across web and Flutter. Tokens drive buttons, cards, modals, forms, tables, and timeline hub widgets while enforcing simplified language (1–2 word labels).【F:docs/updates/1.00/update_task_list.md†L145-L153】【F:docs/updates/1.00/features_to_add.md†L10-L21】
- **Responsive Containers:** All layouts adopt responsive container rules to eliminate text wrapping, especially in dashboards, the timeline hub, and checkout flows. Breakpoints align with desktop, tablet, and mobile patterns; typography scales accordingly.【F:docs/updates/1.00/features_update_plan.md†L66-L82】
- **Navigation Model:** Replace learner-centric menus with mega menus and footer variants that surface Timeline Hub (Timeline, Custom Job Feed, Marketplace Feed), Explorer, Storefront, Business Front, Dashboards, Support, and Policies. Post-login footers collapse into role dashboards; pre-login footers showcase marketing content.【F:docs/updates/1.00/new_feature_brief.md†L36-L126】【F:docs/updates/1.00/update_task_list.md†L185-L194】
- **Brand & Visual Language:** Adopt a professional service/industrial tone with utility iconography, vector illustrations, and photography emphasising crews, tools, and materials. Ads and recommendation placements include branded frames to distinguish organic vs sponsored content.【F:docs/updates/1.00/features_to_add.md†L10-L25】

## Accessibility & Compliance
- Implement WCAG 2.1 AA contrast, focus, and keyboard navigation across all modules. Language dropdown switches to single-word entries to minimise width and improve clarity.【F:docs/updates/1.00/new_feature_brief.md†L34-L126】
- Provide accessible modals for legal documents, GDPR prompts, and Chatwoot interactions; ensure transcripts/captions for timeline hub events and support sessions.【F:docs/updates/1.00/update_task_list.md†L69-L88】【F:docs/updates/1.00/update_task_list.md†L228-L236】

## Commerce & Finance Presentation
- Storefront, business front, tool/material/service viewers, and checkout sequences adopt card-based summaries, sticky order summaries, pricing highlights, and compliance callouts (tax, escrow, refunds). Finance widgets surface metrics, ledger entries, and export controls with consistent charting styles.【F:docs/updates/1.00/update_task_list.md†L165-L183】【F:docs/updates/1.00/update_task_list.md†L112-L120】

## Timeline Hub Enhancements
- Timeline hub cards include ad/recommendation badges, report buttons, follow/unfollow, media galleries, urgency signals for custom jobs, and marketplace stock alerts. Feed analytics panels highlight impressions, conversions, and escalation status for each tab.【F:docs/updates/1.00/new_feature_brief.md†L46-L67】【F:docs/updates/1.00/update_task_list.md†L155-L163】

## Documentation & Support Surfaces
- Integrate Chatwoot bubble post-login only; provide support drawers/inbox styling with conversation tags, attachments preview, emoji/GIF pickers, and quick links to knowledge base articles. Policies adopt long-form layouts with table of contents, breadcrumbs, and acknowledgement components.【F:docs/updates/1.00/update_task_list.md†L69-L88】【F:docs/updates/1.00/update_task_list.md†L185-L194】

## Mobile Parity
- Flutter navigation features role changer splash, bottom tabs, and context menus matching web taxonomy. Screens share card patterns, forms, and modals from the design system to ensure parity across user and provider variants.【F:docs/updates/1.00/features_update_plan.md†L83-L97】【F:docs/updates/1.00/update_task_list.md†L198-L236】
