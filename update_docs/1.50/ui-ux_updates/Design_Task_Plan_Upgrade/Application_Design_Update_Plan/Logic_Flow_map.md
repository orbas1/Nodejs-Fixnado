# Logic Flow Map Overview

## Diagram Structure
- Primary swimlanes: **Authentication**, **Onboarding**, **Dashboard**, **Jobs**, **Financials**, **Support**.
- Each swimlane includes states (rectangles), decision points (diamonds), connectors labelled with trigger events, and notes for error handling.
- Flow map referenced in Figma file `App_Logic_v150.fig` with node IDs matching analytics events for traceability.

## Key Transitions
1. **Login → Dashboard**
   - Checks device trust status; if untrusted, route to 2FA verification before dashboard.
   - Success leads to dashboard load; failure loops to support escalation path.
2. **Dashboard → Onboarding Tasks**
   - If outstanding verification items exist, redirect to onboarding module with overlay explaining requirements.
3. **Job Acceptance Flow**
   - From job list: Accept → Conflict Check → Confirmation → Work Timeline.
   - Decline path prompts for reason and suggests alternative jobs.
4. **Availability Update Loop**
   - Schedule update triggers conflict detection; if conflicts found, prompts resolution choices.
   - Successful update notifies affected jobs and updates analytics event.
5. **Payout Dispute Handling**
   - Payout detail → Dispute CTA → Form submission → Support queue → Resolution summary.

## Error & Exception Paths
- Connectivity loss triggers offline queue state; once restored, operations resume with toast confirmation.
- API failure nodes include fallback messaging and ability to retry or contact support.
- Security alerts (e.g., suspicious login) branch to forced password reset flow.

## Notation Legend
- Rectangles: system states/views.
- Diamonds: decision points with labelled conditions (Yes/No, Success/Fail).
- Circles: Start/End nodes for major flows.
- Dashed lines: Optional or future roadmap steps (e.g., automation suggestions).

## Maintenance Notes
- Update flow map whenever new events introduced; ensure version number annotated in top-right corner.
- Keep archived versions for audit; store exported PDF in `/docs/logic-maps/v1.50/`.
