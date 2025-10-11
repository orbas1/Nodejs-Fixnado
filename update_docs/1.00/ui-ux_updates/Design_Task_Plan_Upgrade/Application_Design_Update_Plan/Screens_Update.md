# Screen Updates — Compliance Integration (Version 1.00)

## Admin & Support Mobile Panels
- **Dispute Transcript Export Modal:** Present compliance rationale (“Transcripts include personal data. Exports are logged and require compliance approval.”) with dual confirmation buttons. CTA uses primary gradient, secondary CTA labelled “Request approval” gating export behind compliance workflow.
- **Provider Address Reveal Banner:** Default provider profile shows city + postcode district. Reveal button triggers modal with checklist referencing DPIA storage windows and RBAC audit trail. Banner copy links to support article describing temporary access rights.
- **Chat Retention Notice:** Chat threads display retention tooltip (90 days standard, 2 years for disputes). Tooltip anchored to header info icon; includes link to privacy policy and action to escalate dispute that extends retention.

## Field Service Screens
- **On-site Check-in:** Introduce consent checkbox for photographing premises. Checkbox state persisted locally and sent to backend as part of booking update payload. Inline copy references DPIA-02 mitigation (“Photos stored encrypted, deleted after dispute resolution or 180 days”).
- **Incident Reporting:** Add radio buttons for severity and optional voice note upload. Confirmation screen highlights retention and anonymisation details with direct link to issue intake process, encouraging staff to log design-impacting incidents.

## Telemetry Opt-out Prompt
- Add “Why we collect this” link next to theme toggle in settings. Link opens bottom sheet summarising hashed-IP approach, retention length (12 months), and opt-out instructions referencing support article ID KB-182.

## Status Messaging Updates
- Error toast for restricted features updated to: “Your role cannot access this feature. Contact a compliance officer or request temporary access in Slack #fixnado-support.” include `aria-live="assertive"` and `data-qa="toast-rbac-restricted"` for testing.

---
*Updated 2025-10-15 alongside compliance evidence refresh (Task 1.5).* 
