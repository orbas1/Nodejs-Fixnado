# Dummy Data Requirements (Web)

| Dataset | Purpose | Fields | Volume |
| --- | --- | --- | --- |
| Homepage Promotions | Validate hero banners and ads logic | Headline, Subtext, Persona, Image URL, CTA Label, CTA URL, Zone Target, Start/End Date | 6 entries |
| Marketplace Listings | Populate service grid | Listing ID, Title, Provider, Rating, Price, Compliance Tags, Availability, Media, Sponsored Flag | 60 entries |
| Package Catalogue | Test package cards and comparison tables | Package ID, Name, Persona, Included Services, Price (monthly/annual), Savings %, Zones, Promotions | 12 entries |
| Custom Job Board | Showcase kanban states | Request ID, Title, Client, Zone, Deadline, Bid Count, Status, Budget, Attachments | 25 entries |
| Dashboard KPIs | Test analytics widgets | Metric Name, Value, Target, Trend %, Persona, Timeframe | 20 entries |
| Campaign Performance | Validate ads manager | Campaign ID, Objective, Status, Budget, Spend, CTR, Conversion %, Start/End, Notes | 15 entries |
| Consent Logs | Demonstrate governance modules | Consent ID, User, Type, Status, Timestamp, Expiry, Source, Notes | 40 entries |
| Notifications | Exercise toast/alert behaviours | Notification ID, Severity, Message, Action Label, Link, Persona, Timestamp | 30 entries |

- Provide JSON and CSV formats for engineering; include localisation strings for at least English (UK) and one additional locale.
- Flag records that should trigger edge cases (e.g., expired compliance, over-budget campaign) for QA.
