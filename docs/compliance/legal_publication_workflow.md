# Legal Publication Workflow – Version 1.00

This document records the workflow used to publish and monitor legal policies (terms, privacy, refund, community guidelines, about, FAQ) for Fixnado Version 1.00.

## Publication Process
1. **Drafting** – Legal counsel drafts content in the legal console (`/admin/legal`) using structured sections, metadata (audience, acknowledgement, governance), and attachments (checklists, templates).
2. **Review** – Draft versions are reviewed by Trust & Safety, Finance, and Compliance leads. Review notes are stored in the draft change log and exported as PDF for audit.
3. **Approval** – Once reviewed, legal counsel schedules an effective date and publishes the document. Publication automatically updates the public endpoint (`/api/legal/:slug`) and clears cached copies in the web client.
4. **Acknowledgement** – LMS integrations push mandatory acknowledgements to relevant personas. Acknowledgement data is stored in the compliance warehouse for sampling.

## Version Control
- Legal documents are stored in `LegalDocuments` and `LegalDocumentVersions` tables with immutable change history.
- The admin console exposes version timelines, draft status, and health indicators (last published, next review due).
- Public APIs expose metadata (`statusLabel`, `health`, `acknowledgement`, `audience`, `governance`) enabling dashboards to highlight overdue reviews.

## Evidence Captured on 30 May 2024
| Document | Version | Effective | Owner | Evidence |
| --- | --- | --- | --- | --- |
| Terms & Conditions | v1.1 | 2024-05-01 | Legal Team | `legal/evidence/terms-v1.1.pdf` |
| Privacy Policy | v1.1 | 2024-05-01 | Privacy Office | `legal/evidence/privacy-v1.1.pdf` |
| Refund Policy | v1.0 | 2024-05-30 | Finance & Compliance | `legal/evidence/refund-v1.0.pdf` |
| Community Guidelines | v1.0 | 2024-05-30 | Trust & Safety | `legal/evidence/community-guidelines-v1.0.pdf` |
| About Fixnado | v1.0 | 2024-05-30 | Executive Office | `legal/evidence/about-fixnado-v1.0.pdf` |
| FAQ | v1.0 | 2024-05-30 | Customer Experience | `legal/evidence/faq-v1.0.pdf` |

## Monitoring & Alerts
- Nightly job `legal-publication-monitor` checks for documents approaching review dates (<30 days) and posts alerts to the Governance Slack channel.
- Grafana dashboard “Legal Health” displays status labels, acknowledgement completion rates, and outstanding review tasks.
- The admin console highlights documents without published versions or missing acknowledgement coverage.

## Retention & Accessibility
- Historical versions remain accessible through the admin console and `/api/admin/legal/:slug/versions` endpoint for audit purposes.
- Public website caches are purged automatically on publication. CDN invalidation references are stored in the release vault.
- Print-ready PDFs are archived in the governance SharePoint library with checksum validation.

## Sign-Off
- Legal Counsel confirmed publication of new policies at 16:00 BST, 30 May 2024.
- Compliance Lead verified acknowledgement coverage (sample size 100) and DSAR references.
- Executive Sponsor recorded decision `LEGAL-DEC-2024-05-30` in the governance decision log.
