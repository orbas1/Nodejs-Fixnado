# Dummy Data Requirements — Web Application v1.00

## Goals
Ensure Storybook, Chromatic, and end-to-end tests have realistic datasets covering consumer and provider flows.

## Data Tables
| Dataset | Records | Fields | Notes |
| --- | --- | --- | --- |
| Users | 50 | id, name, role, email, zones[], permissions | Include admin, provider, consumer roles |
| Providers | 80 | id, businessName, rating, zones[], services[], campaignStatus | Provide mix of verified and sponsored |
| Zones | 20 | id, name, geojson, metrics (coverageScore, demandIndex) | Provide metrics for analytics widgets |
| Bookings | 200 | id, userId, providerId, status, scheduledAt, amount | Balanced statuses |
| Campaigns | 40 | id, title, status, spend, impressions, cpc | For marketplace views |
| Bids | 120 | id, jobId, providerId, amount, status, dueAt | Feed kanban columns |
| Compliance Tasks | 60 | id, providerId, type, dueAt, status, documentUrl | |
| Notifications | 120 | id, type, message, createdAt, link | For notifications drawer |
| Messages | 500 | conversationId, senderId, body, timestamp, attachments[] | |

## Storage
- JSON fixtures stored in `apps/web/public/mock-data/v1.00/`.
- Provide GraphQL mocks via MSW for Storybook.

## Refresh Process
- Update quarterly or upon schema change.
- Document generator script `scripts/mock-data/generate_web_v1.ts` to update fixtures.
