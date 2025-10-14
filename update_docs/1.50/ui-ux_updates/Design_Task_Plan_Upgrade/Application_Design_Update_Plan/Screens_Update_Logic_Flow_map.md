# Screen-to-Flow Map Table

| Screen ID | Flow Node | Entry Trigger | Exit Paths | Notes |
| --- | --- | --- | --- | --- |
| `ONB-PERSONA` | `onboarding.persona_select` | App launch after login with incomplete onboarding | `ONB-DOCS`, `ONB-SKIP` | Displays persona cards; analytics event `provider_onboarding_persona_selected` |
| `ONB-DOCS` | `onboarding.document_upload` | Persona selection complete | `ONB-VERIFY`, `ONB-DOCS-RETRY` | Supports camera & file upload, handles offline queue |
| `DASH-HOME` | `dashboard.home` | Successful login/onboarding completion | `JOB-LIST`, `FIN-SUMMARY`, `SETTINGS` | Loads KPI metrics, action queue |
| `JOB-LIST` | `jobs.list` | Dashboard nav, push tap | `JOB-DETAIL`, `JOB-FILTER` | Maintains filter state |
| `JOB-DETAIL` | `jobs.detail` | Job card, notification | `JOB-TIMELINE`, `JOB-MESSAGE`, `JOB-ISSUE` | Contains quick actions |
| `CAL-WEEK` | `availability.week_view` | Calendar tab | `CAL-TEMPLATE`, `CAL-CONFLICT` | Highlights conflicts |
| `FIN-SUMMARY` | `financials.summary` | Financials tab, payout notification | `FIN-DETAIL`, `FIN-EXPORT` | Payout chart + filters |
| `FIN-DETAIL` | `financials.detail` | Summary card tap | `FIN-DISPUTE`, `FIN-BACK` | Contains dispute CTA |
| `SUPPORT-INBOX` | `support.inbox` | Inbox tab | `SUPPORT-THREAD`, `SUPPORT-KB` | Combined chat/support |
| `SETTINGS-HOME` | `settings.home` | Profile icon | `SETTINGS-NOTIF`, `SETTINGS-SECURITY` | Sectioned list |

## Maintenance
- Update table whenever screens added/removed; keep in sync with analytics and routing configuration.
- Provide cross-reference to Figma page and Jira ticket for each screen.
