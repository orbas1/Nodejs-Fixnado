# Copy & Messaging Framework — Web Application v1.00

## Voice Principles
- Authoritative yet approachable. Use direct language with actionable CTAs.
- Maintain consistency with mobile microcopy while adapting for larger canvas.
- Title case for headings, sentence case for body copy.

## Key Strings
| Key | Default Text | Context |
| --- | --- | --- |
| `web_landing_headline` | "Coordinate every service zone from a single command center" | Landing hero |
| `web_landing_subhead` | "Discover trusted providers, optimise coverage, and activate campaigns instantly." | |
| `web_landing_cta_primary` | "Find Providers" | Primary CTA |
| `web_landing_cta_secondary` | "Become a Provider" | Secondary CTA |
| `web_explorer_search_placeholder` | "Search by service, provider, or zone" | Search bar |
| `web_explorer_results_title` | "Results in {zoneName}" | Results header |
| `web_provider_profile_cta` | "Book Appointment" | Provider profile |
| `web_dashboard_title` | "Today at a glance" | Consumer dashboard |
| `web_provider_dashboard_title` | "Operational overview" | Provider dashboard |
| `web_marketplace_banner_title` | "Launch geo-targeted campaigns" | Marketplace hero |
| `web_compliance_progress_label` | "Compliance score" | Widget |
| `web_settings_title` | "Settings" | Settings page |
| `web_settings_subtitle` | "Configure your Fixnado workspace" | |
| `web_notifications_empty` | "You're all caught up" | Notifications drawer |
| `web_error_generic` | "Something went wrong. Refresh or try again later." | Error states |

## Microcopy Guidelines
- Buttons: 1–3 words, strong verbs ("Activate", "View report").
- Tooltips: Provide clarifying detail ("Sponsored providers appear at the top for 24 hours").
- Empty states: Encourage next action ("No bookings yet. Start by finding a provider.").
- Table column headers: Title case, avoid abbreviations.

## Accessibility & Internationalisation
- Provide `aria-labels` for icons mirroring copy deck.
- Reserve 30% extra width for translations; ensure responsive design handles longer strings.
- Support localisation via `next-intl`, storing strings under `messages/web/en.json`.
- Provide fallback copy for dynamic data (e.g., `zoneName` fallback "your area").
