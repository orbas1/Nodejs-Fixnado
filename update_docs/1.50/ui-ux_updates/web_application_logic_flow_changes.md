# Web Application Logic Flow Changes

## Persona Routing & Access Control
- Unified login directs users to persona-specific dashboards based on role assignments.
- Role switcher validates permissions before exposing workspace modules; audit log records transitions.
- Admin overrides allow impersonation with explicit consent logging.

## Marketplace Experience
1. **Search & Filter**
   - Query service hits zone-aware index; results merge providers, packages, rentals.
   - Ad placements injected using relevance score while respecting compliance filters.
2. **Compare & Decide**
   - Users can pin providers to comparison tray; logic fetches metrics (pricing, SLA, compliance) for side-by-side view.
   - Availability check ensures selected slot feasible; alternative suggestions auto-generated when conflicts found.
3. **Checkout & Booking**
   - Multi-step checkout collects schedule, add-ons, payment, confirmations.
   - Deposits and instalments supported; compliance disclaimers must be acknowledged.

## Provider Operations Flow
- Dashboard surfaces tasks from bookings, compliance, ads campaigns.
- Job acceptance triggers route planning, team assignment, and asset reservation workflows.
- Inventory adjustments propagate to rental listings and booking availability in real time.

## Custom Job Lifecycle
- Creation wizard with validation, attachments, AI helper.
- Bids tracked via status engine; acceptance notifies all parties and updates analytics.
- Disputes escalate through timeline with evidence upload and mediation outcomes.

## Admin Governance
- Consent management flow ensures audit trails for AI usage, data exports, and deletion requests.
- Dispute resolution board integrates messaging logs and timeline actions; decisions update financial state.
- Compliance module monitors document expirations, triggers reminders, and enforces gating on overdue providers.

## Platform Operations & Release Management (New)
- Promotion control centre surfaces Terraform plan summaries, Git release tags, and approver sign-offs before production deployments.
- Incident workspace links to the backup/DR runbook, enabling failover execution with progress trackers and post-incident template export.
- Alarm console consumes CloudWatch alerts (5xx, ECS CPU) with inline playbooks; acknowledges integrate with PagerDuty via API.

## Notifications & Integrations
- Event bus publishes key actions to messaging, analytics, and CRM connectors.
- Agora integration for embedded calls requires pre-call checks (permissions, connectivity) before launching modals.
- Observability hooks capture latency, errors, and user behaviour for dashboards.
