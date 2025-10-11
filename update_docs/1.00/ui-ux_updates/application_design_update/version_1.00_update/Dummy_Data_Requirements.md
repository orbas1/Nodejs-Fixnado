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
- Include unit tests ensuring fixture schema matches API contracts using JSON Schema validation (`schemas/mobile/v1`).
- Store checksum file `checksums.txt` with SHA256 per asset to detect drift in CI.

## Sample Records
- **Provider JSON Example**
```json
{
  "id": "prov_1001",
  "name": "Fixnado Cooling Pros",
  "zones": ["zone_core_01", "zone_expansion_02"],
  "services": ["svc_hvac_install", "svc_maintenance"],
  "rating": 4.87,
  "reviewsCount": 328,
  "badges": ["verified", "top_rated"],
  "pricingTier": "enterprise",
  "responseTime": "00:15:00",
  "availability": {
    "mon": ["08:00-18:00"],
    "tue": ["08:00-18:00"],
    "sat": ["09:00-14:00"]
  }
}
```
- **Compliance Document Example**: includes `statusHistory` array with timestamps to simulate timeline UI.
- **Messaging Conversation Example**: include attachments `[{"type": "image", "url": "https://cdn.fixnado.com/mock/attachments/inspection.jpg"}]`.

## QA Usage
- Link dummy data to automated golden tests generating screen states for baseline comparisons.
- Provide `fixtures_state_map.md` mapping fixture combos to target screens (e.g., `booking_pending.json` → Booking Detail). Ensure testers know which dataset to load.
