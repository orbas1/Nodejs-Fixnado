# Dummy Data Requirements — Phone Application v1.00

## Purpose
Provide QA and development teams with consistent seed data enabling offline prototyping and automated tests.

## Data Sets
| Dataset | Records | Fields | Notes |
| --- | --- | --- | --- |
| Users | 25 | id, name, email, role, subscriptionTier, zones | 10 consumers, 15 providers |
| Providers | 40 | id, services[], rating, responseTime, badges[], pricingTier, availability | Include mix of verified/top rated/sponsored |
| Zones | 12 | id, name, type (core/expansion/prospective/restricted), polygon coordinates | Provide at least 3 polygons per type |
| Services | 18 | id, category, description, basePrice, upsells[] | Align with marketplace taxonomy |
| Campaigns | 10 | id, title, description, priceImpact, bannerAsset, eligibility | Include provider subscription gating |
| Bookings | 60 | id, userId, providerId, status, scheduledAt, total, zoneId | Cover statuses: pending, confirmed, completed, cancelled |
| Messages | 200 | conversationId, participants[], lastMessage, unreadCount | Provide 10 sample conversations |
| Conversations | 2000 | messageId, senderId, body, timestamp, attachments[] | Include attachments sample URLs |
| Documents | 30 | id, providerId, type, status, expiryDate, fileUrl | Cover states pending, approved, rejected |
| Notifications | 50 | id, type, payload, read, createdAt | For booking, compliance, marketplace |

## File Locations
- JSON fixtures stored in `/assets/mock_data/v1.00/` with naming `providers.json`, `zones.json`, etc.
- Provide CSV exports for analytics validation.

## Behavioural Requirements
- Each dataset includes localization fields (`title_en`, `title_es`).
- Provide placeholder image URLs referencing CDN or local assets (IDs matching `Screens_update_images_and_vectors.md`).
- For Map polygons, supply GeoJSON with coordinates for offline map.

## Refresh Cadence
- Update dummy data monthly or when backend schema changes.
- Maintain script `scripts/mock-data/generate_phone_v1.py` to rehydrate.
