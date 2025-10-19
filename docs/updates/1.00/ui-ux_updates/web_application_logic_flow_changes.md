# Web App – Logic Flow Changes

## Authentication & Role Handling
1. Visitor arrives at home page → chooses login/register → completes single-word language dropdown, social login/2FA, accepts policies → directed to role chooser → selects persona → navigation, dashboards, and permissions rehydrate accordingly.【F:docs/updates/1.00/new_feature_brief.md†L34-L74】【F:docs/updates/1.00/update_task_list.md†L69-L88】【F:docs/updates/1.00/update_task_list.md†L145-L194】
2. Feature flags and configuration data load prior to rendering header mega menu to ensure timeline rename, ads, and Chatwoot support align with permissions.【F:docs/updates/1.00/update_task_list.md†L16-L24】【F:docs/updates/1.00/update_task_list.md†L185-L194】

## Timeline Lifecycle
1. User composes post → upload checker validates assets → backend spam/bad-word service screens content → if flagged, enters moderation queue; otherwise publishes to timeline with ads/recommendation metadata and analytics events.【F:docs/updates/1.00/new_feature_brief.md†L46-L74】【F:docs/updates/1.00/update_task_list.md†L155-L163】
2. Timeline hub renders via streaming updates (socket.io) mixing organic posts, ads, recommendations, custom job alerts, and marketplace promotions across three feeds. Interactions update counters in real time and feed analytics dashboards for providers/admins.【F:docs/updates/1.00/update_task_list.md†L92-L110】【F:docs/updates/1.00/update_task_list.md†L155-L163】

## Explorer & Commerce
1. Search form submits filters (zones, tags, skills, qualifications, pricing, availability, hashtags) → backend returns ranked results with explanation data → UI displays card grid with quick CTA buttons. Selected item opens viewer with zone map, availability calendar, checkout CTAs.【F:docs/updates/1.00/features_to_add.md†L18-L21】【F:docs/updates/1.00/update_task_list.md†L165-L173】
2. Checkout wizard handles cart assembly, schedule selection, payment, escrow/wallet choices, tax calculations, and final confirmation; triggers ledger updates and notifications across dashboards.【F:docs/updates/1.00/new_feature_brief.md†L56-L126】【F:docs/updates/1.00/update_task_list.md†L112-L120】

## Dashboards & Analytics
1. Persona dashboards load modular widgets via API aggregator, retrieving metrics, pipeline, calendar, roster, finance, support, and compliance data. Widgets support drill-down, export, and in-place editing (e.g., roster updates).【F:docs/updates/1.00/new_feature_brief.md†L56-L126】【F:docs/updates/1.00/update_task_list.md†L175-L183】
2. Real-time updates from timeline hub, commerce, and support dashboards via websockets and scheduled jobs; failure handling logs to observability stack and surfaces alerts in dashboard banners.【F:docs/updates/1.00/update_task_list.md†L26-L34】【F:docs/updates/1.00/update_task_list.md†L271-L279】

## Support & Timeline Hub Operations
1. Timeline hub moderation queues stream flagged posts, custom job requests, and marketplace alerts to role-based dashboards; escalation actions (mute, refund, reassign) propagate across services and analytics counters.【F:docs/updates/1.00/update_task_list.md†L102-L110】【F:docs/updates/1.00/update_task_list.md†L155-L163】
2. Support bubble activates Chatwoot widget after login, mirroring inbox on dashboard; attachments, emoji/GIFs, and help center results sync with backend. Support metrics update admin dashboards and QA evidence logs.【F:docs/updates/1.00/new_feature_brief.md†L67-L74】【F:docs/updates/1.00/update_task_list.md†L228-L236】

## Compliance & Legal
1. Policy pages display latest version with anchored table of contents; acceptance buttons record acknowledgements per user and update compliance dashboards. GDPR requests triggered from settings propagate to backend workflows with audit trails.【F:docs/updates/1.00/update_task_list.md†L69-L88】【F:docs/updates/1.00/update_task_list.md†L185-L194】
2. Maintenance mode toggles (admin) broadcast UI banners across dashboards, update storefront availability, and log change history for governance documentation.【F:docs/updates/1.00/new_feature_brief.md†L56-L126】【F:docs/updates/1.00/update_task_list.md†L175-L183】
