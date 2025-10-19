# Provider App – Logic Flow Changes

## Role Selection & Authentication
1. User selects provider persona from role changer → completes multi-factor login or social auth → accepts latest policies with recorded acknowledgement → lands on provider dashboard with personalised data feeds.【F:docs/updates/1.00/new_feature_brief.md†L36-L126】【F:docs/updates/1.00/update_task_list.md†L198-L206】【F:docs/updates/1.00/update_task_list.md†L69-L88】
2. Session manager syncs feature flags (timeline hub feeds, ads, finance modules) via remote config before rendering navigation.【F:docs/updates/1.00/update_task_list.md†L16-L24】

## Dashboard Data Refresh
1. On load, API requests fetch metrics (orders, rentals, materials, ads), financial balances, and timeline insights in parallel; caching ensures offline resilience.【F:docs/updates/1.00/update_task_list.md†L112-L120】【F:docs/updates/1.00/update_task_list.md†L239-L246】
2. Notifications queue aggregates compliance alerts, Chatwoot updates, and moderation tasks; acknowledgement flows update audit logs.【F:docs/updates/1.00/update_task_list.md†L69-L88】【F:docs/updates/1.00/update_task_list.md†L228-L236】

## Service & Inventory Management
1. Provider taps “Add service/material/tool” → guided wizard collects details, pricing, tags, zones, media → upload checker scans assets → preview generated → confirmation posts to API → timeline updates with optional sponsored placement.【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L13-L21】【F:docs/updates/1.00/update_task_list.md†L112-L140】
2. Edits and availability toggles trigger real-time updates to explorer/search and storefront pages; inventory changes propagate to rentals availability and analytics widgets.【F:docs/updates/1.00/new_feature_brief.md†L56-L126】【F:docs/updates/1.00/update_task_list.md†L165-L173】

## Pipeline & Scheduling
1. Leads enter pipeline from explorer/bookings or custom jobs → provider assigns crew → schedules through calendar with zone/timezone validation → automated reminders send via notifications and email/SMS integrations.【F:docs/updates/1.00/new_feature_brief.md†L56-L126】【F:docs/updates/1.00/update_task_list.md†L218-L226】
2. Status changes update finance projections, escrow commitments, and risk dashboards while logging timeline activity for transparency.【F:docs/updates/1.00/update_task_list.md†L112-L120】【F:docs/updates/1.00/update_task_list.md†L208-L216】

## Finance, Escrow & Tax
1. Payments settle into wallet/escrow; providers view ledger entries, release funds, issue refunds, or escalate disputes; all actions write audit trails and update tax summaries.【F:docs/updates/1.00/new_feature_brief.md†L56-L126】【F:docs/updates/1.00/update_task_list.md†L112-L120】
2. Tax module aggregates jurisdictional rules from zone data, prompting compliance tasks (VAT, invoices) and linking to policy references.【F:docs/updates/1.00/features_update_plan.md†L34-L47】【F:docs/updates/1.00/update_task_list.md†L218-L226】

## Support & Timeline Hub Operations
1. Support bubble/inbox triggers Chatwoot session → provider selects ticket/help center/peer chat → attaches files or media → conversation metadata stored for reporting.【F:docs/updates/1.00/new_feature_brief.md†L67-L74】【F:docs/updates/1.00/update_task_list.md†L228-L236】
2. Timeline hub moderation flows escalate flagged feed content from report buttons to provider dashboards, enabling role adjustments, muting, or banning directly from mobile.【F:docs/updates/1.00/update_task_list.md†L155-L163】【F:docs/updates/1.00/update_task_list.md†L208-L216】

## Compliance & Maintenance Mode
1. Providers review policy updates, acknowledge changes, and adjust maintenance mode or appearance settings; acknowledgements sync with legal records and update analytics dashboards.【F:docs/updates/1.00/update_task_list.md†L69-L88】【F:docs/updates/1.00/update_task_list.md†L185-L194】
2. Maintenance mode triggers notifications to crews/customers, updates storefront availability, and logs state changes for governance reports.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L3-L33】【F:docs/updates/1.00/update_task_list.md†L175-L183】
