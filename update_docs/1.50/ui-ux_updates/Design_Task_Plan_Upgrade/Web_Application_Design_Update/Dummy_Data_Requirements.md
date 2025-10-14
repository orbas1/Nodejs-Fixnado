# Dummy Data Requirements (Web)

## Data Sets Needed
1. **Dashboard Metrics** – Utilisation percentages, revenue figures, job counts for last 12 weeks.
2. **Approvals & Requests** – Sample procurement requests with statuses, requestor info, cost estimates.
3. **Marketplace Providers** – Profiles with ratings, response times, service areas, pricing tiers.
4. **Resource Hub Content** – Articles, videos, templates with metadata (author, date, tags, read time).
5. **Reports** – Saved report configurations, export schedules, recipients.
6. **Notifications** – Alerts covering system updates, expiring contracts, approvals.

## Data Format
- Use JSON fixtures stored under `design-data/web/` grouped by domain.
- Include realistic values, decimals, and long text for edge cases.
- Provide localisation variations (EN, FR, ES) to validate translation handling.

## Usage
- Populate prototypes, user testing environments, Storybook stories.
- Ensure data covers empty, normal, and extreme scenarios (e.g., high volume approvals).

## Maintenance
- Review prior to release to align with any new fields or features.
- Document generation scripts for reproducibility and share via repository.
