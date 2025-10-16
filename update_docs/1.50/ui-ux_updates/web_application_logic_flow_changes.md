# Web Application Logic Flow Changes (v1.50)

## Navigation & Routing
- Implement unified navigation service that updates breadcrumbs, header highlights, and dock states based on route metadata; ensures deep links maintain context.
- Role-based guards redirect unauthorised users to request access modal while logging attempts for security audit.
- Quick search command palette fetches entities (jobs, providers, resources) with typeahead suggestions; selecting result opens modal or new tab depending on entity type.
- Workspace hub derives card content from the enriched `dashboardConfig` descriptors, grouping dashboards by capability tiers, region coverage, and service levels; request-only workspaces surface inline escalation contacts and automatically launch the request-access modal with prefilled context for audit logging.
- Mega menu entries hydrate from the same descriptors so IA parity is maintained—badge metadata, feature highlights, and capability preview excerpts remain synchronised when dashboard definitions evolve.
- Escalation links honour per-workspace configuration, opening secure `mailto:` payloads that embed tenant, capability, and requester details captured from the navigation service before dispatching to the escalation roster.

## Dashboard Logic
- Dashboard widgets now lazy-load data streams; each widget emits loading, success, and error states to central store for consistent skeleton handling.
- Action queue prioritisation algorithm factors SLA breaches, compliance deadlines, and unread approvals; items escalate to "Critical" column when thresholds met.
- Operations Timeline merges job, maintenance, and audit events sorted by start time; clicking event opens detail drawer pre-populated with relevant actions.
- Workspace hub preview drawer renders capability overviews by reading the same descriptor record powering each card; selecting "View capabilities" opens a dialog showing service level objectives, integrations, and key contacts without leaving the hub while persisting scroll position.

## Marketplace Flows
- Marketplace search filters sync with URL query params enabling shareable states; clearing filters resets to persona defaults (e.g., procurement vs. operations).
- Quote request drawer collects data across tabs; validation ensures each step completed before enabling submission; once submitted, API call triggers notification and logs event.
- Provider comparison logic allows selecting up to three providers; comparison table renders capabilities, SLAs, pricing tiers, and ratings side-by-side.
- Explorer ranking layer scores services and marketplace items using zone demand weighting, company compliance scores, availability preferences, and price heuristics so results surface compliant in-zone providers and rentable stock before out-of-region listings.
- Live feed stream opens an SSE channel with heartbeat checks, applies the same zone/out-of-zone filters as initial snapshots, updates status badges in real time, and triggers exponential backoff retries with informative toasts when the connection drops or infra proxies buffer events.

## Resource Hub & Support
- Resource hub filter interactions update results without page refresh using incremental fetching; bookmarking article adds to personalised quick access list.
- Article feedback widget sends rating + optional comment to analytics service; negative feedback prompts optional support ticket creation.
- Release note timeline integrates with changelog API, caching results per session; pagination loads older entries seamlessly.

## Settings & Administration
- User management table supports inline role edits; changes queue until "Save" pressed, then batch update API call ensures atomicity; rollback if any update fails.
- Integrations settings include OAuth connection flows; success triggers status badge update and confirmation email.
- Audit log viewer loads entries with infinite scroll; filters by actor, action, timeframe update query and persist across sessions.

## Reporting & Exports
- Report builder ensures filter selections stored in draft state; saving as template shares with org or personal scope based on permission selection.
- Export scheduler validates cron-like recurrence inputs; generating export triggers background job and notifies subscribers via email with download link.

## Finance Monitoring & Escalation
- Alert feed consumes `/api/finance/alerts` payloads every 3 minutes, grouping by escalation key and collapsing duplicate webhook events while surfacing retry attempt history and last delivery channels.
- Acknowledging an alert posts responder metadata back to the API, flips UI state to "In Progress", and pauses repeat notifications until countdown reaches zero or severity increases.
- Manual refresh triggers a fan-out re-evaluation and merges results with cached state to avoid UI flicker; degraded responses surface fallback copy and prompt operators to consult runbooks linked from the alert drawer.

## Compliance Operations Console
- Warehouse export panel queries latest runs on load, presenting dataset cards with run summaries; selecting a dataset filters the run table and reveals manual trigger CTA with dataset-specific prerequisites.
- Manual trigger flow enforces justification entry, dataset validation, and retention acknowledgement before calling the backend; progress indicator polls run status every 15 seconds with exponential backoff when idle.
- Error states provide remediation actions (retry export, view troubleshooting doc, contact security) while success surfaces download and DPIA documentation buttons alongside retention countdown chips synced from run metadata.

## Creation Studio Workflows
- **Blueprint orchestration:** Landing state fetches blueprint catalogue, caches persona-scoped results, and surfaces compliance badges; selecting a blueprint initialises wizard state, pre-filling personas, recommended regions, and automation hints.
- **Draft autosave pipeline:** Wizard dispatches debounced autosave events that persist drafts server-side and record timestamps in the reducer; UI surfaces status chips, retry actions, and failure toasts when autosave fails.
- **Slug governance:** Slug field normalises input, calls `/api/creation-studio/slug-check`, and renders inline errors with recommended alternatives when duplicates exist while logging events for analytics.
- **Compliance gating:** Publish CTA remains disabled until blueprint-required checklist items are confirmed; missing items highlight with inline callouts, and analytics fire `creation_publish_blocked` events for operations insight.
- **Publish confirmation:** Final step summarises key attributes, requires explicit confirmation of compliance/availability, triggers publish API call, and on success routes to success screen with storefront URL plus background job ID for audit trails.

## Error Handling & Observability
- Global error boundary captures unexpected issues and displays recovery modal with support link; errors tagged with correlation ID for diagnostics.
- Route-level error boundaries now surface telemetry confirmation, locale-aware support copy, and optional retry for recoverable loaders while dispatching structured payloads through the `errorReporting` helper.
- 404 flow renders the dedicated `NotFound` screen, logging the stale URL and referrer before guiding users back to high-value destinations or reporting broken navigation.
- Telemetry events instrumented for navigation search usage, widget refresh, quote submissions, resource feedback, settings saves, and export completions with timestamps and actor metadata.
- Added analytics events for `live_feed_stream_opened`, `live_feed_stream_reconnected`, and `live_feed_stream_error` so product, SRE, and support teams can monitor connection health and correlate UI fallbacks with backend or network issues.
