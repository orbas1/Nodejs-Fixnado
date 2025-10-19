# User App – Logic Flow Changes

## Authentication & Role Switching
1. Visitor selects registration → completes form with single-word language dropdown, optional social login, and 2FA → accepts policies → assigned default user role with option to switch via role changer. Role switch prompts validation before loading targeted dashboards.【F:docs/updates/1.00/new_feature_brief.md†L34-L74】【F:docs/updates/1.00/update_task_list.md†L69-L88】【F:docs/updates/1.00/update_task_list.md†L198-L206】
2. Session initialisation fetches remote configuration (feature flags, Chatwoot credentials, recommendation weights) prior to rendering timeline.【F:docs/updates/1.00/update_task_list.md†L16-L24】

## Timeline Interaction
1. Timeline hub API returns segmented feeds (Timeline, Custom Job Feed, Marketplace Feed) with ads, recommendations, and service/material promotions. Client merges results with cached offline items, respects feed targeting, and renders cards in chronological/relevance order.【F:docs/updates/1.00/new_feature_brief.md†L46-L67】【F:docs/updates/1.00/update_task_list.md†L155-L163】
2. Post interactions (like, comment, follow, report) fire asynchronous mutations with optimistic UI updates; spam/bad-word scanner responses update moderation badges. Ads/recommendations track impressions and conversions for analytics dashboards.【F:docs/updates/1.00/new_feature_brief.md†L46-L74】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L13-L21】

## Explorer & Discovery
1. User selects filters (zones, categories, tags, pricing, availability) → request hits search API → results paginated by relevance and zone proximity. Quick actions (Book, Rent, Buy) prefill checkout wizard with selected SKU and zone details.【F:docs/updates/1.00/features_to_add.md†L18-L21】【F:docs/updates/1.00/update_task_list.md†L165-L173】
2. Recommendations service returns supplemental suggestions based on skills, qualifications, hashtags, price range, and prior behaviour; explanation metadata surfaces in UI badges.【F:docs/updates/1.00/update_task_list.md†L122-L130】

## Commerce & Fulfilment
1. Checkout wizard collects cart items, scheduling, payment method, escrow selection, and compliance acknowledgements → on submit, payment gateway authorises, wallet/escrow updated, receipts generated, and timeline hub receives confirmation events for relevant feeds.【F:docs/updates/1.00/new_feature_brief.md†L56-L126】【F:docs/updates/1.00/update_task_list.md†L112-L120】
2. Orders feed user dashboard with statuses; user can reschedule, cancel, request refund, or escalate dispute. Wallet view shows ledger updates and allows top-up via supported methods.【F:docs/updates/1.00/update_task_list.md†L175-L183】【F:docs/updates/1.00/update_task_list.md†L112-L120】

## Support & Inbox
1. Support bubble initialises Chatwoot session after login; user selects help center, ticket, or peer chat, uploads attachments, and receives notifications mirrored in dashboard inbox.【F:docs/updates/1.00/new_feature_brief.md†L67-L74】【F:docs/updates/1.00/update_task_list.md†L228-L236】

## Compliance & Data Rights
1. Settings page allows data export/delete requests, privacy toggles, consent review, and policy acknowledgement history retrieval. Requests trigger backend workflows with audit logs and email confirmations.【F:docs/updates/1.00/update_task_list.md†L69-L88】
2. Maintenance toggles for notifications or timeline preferences update backend preferences and analytics to ensure compliance with GDPR consent state.【F:docs/updates/1.00/pre-update_evaluations/issue_report.md†L12-L16】【F:docs/updates/1.00/update_task_list.md†L175-L183】
