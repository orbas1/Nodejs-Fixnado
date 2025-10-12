# Business Front & Provider Profile Changes — Version 1.00

## 2025-10-23 — Business Front Publication & SLA Surfacing
- `frontend-reactjs/src/pages/BusinessFront.jsx` now resolves slugs via route params or query string, defaulting to curated storefronts (e.g., `metro-power-services`) with hero copy, compliance badges, service packages, testimonials, highlight metrics, and support channels. Fallback content mirrors marketing copy from `website_drawings.md` to preserve UX while data loads.
- `panelClient.js` centralises fetch logic for business fronts, injecting bearer tokens when present and converting HTTP failures into descriptive `PanelApiError`s so the page can render production-grade error banners with retry guidance.
- Highlight metrics, testimonials, and showcases map to backend payloads; operations meta tiles expose bookings, alerts, and campaign CTR aligning with provider/enterprise dashboards. Accessibility hooks include aria-busy states, aria-live alerts, and keyboard-focusable CTA cards.
- Navigation (`components/Header.jsx`) promotes business fronts alongside provider/enterprise dashboards within a mega-menu, aligning cross-channel journeys with `menu_drawings.md` and ensuring instrumentation/QA selectors (`data-qa="business-front-*"`) guide automated coverage ahead of Subtask 4.5 localisation audits.
