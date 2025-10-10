# Web Application Page Inventory — Version 1.00

| # | Page Name | Route | Description | Primary Owner |
| --- | --- | --- | --- | --- |
| 1 | Landing / Explorer Entry | `/` | Marketing hero + zone preview | Growth squad |
| 2 | Explorer | `/explorer` | Map/list for zone discovery | Geo squad |
| 3 | Provider Profile | `/providers/[id]` | Detailed provider info | Marketplace squad |
| 4 | Booking Wizard | `/bookings/new` | Multi-step booking flow | Booking squad |
| 5 | Booking Dashboard | `/bookings` | Table of bookings with filters | Booking squad |
| 6 | Booking Detail | `/bookings/[id]` | Timeline, documents, actions | Booking squad |
| 7 | Marketplace | `/marketplace` | Packages, campaigns | Marketplace squad |
| 8 | Campaign Builder | `/marketplace/campaigns/new` | Configure ad campaigns | Marketing tech |
| 9 | Compliance Centre | `/compliance` | Document management | Compliance squad |
| 10 | Compliance Detail | `/compliance/[id]` | Document review + timeline | Compliance squad |
| 11 | Analytics Overview | `/analytics` | KPI dashboards | Analytics squad |
| 12 | Analytics Detail | `/analytics/[report]` | Custom reporting | Analytics squad |
| 13 | Messages | `/messages` | Conversation hub | Communications squad |
| 14 | Support Centre | `/support` | Knowledge base, tickets | Support squad |
| 15 | Settings (Profile) | `/settings/profile` | Personal info | Platform squad |
| 16 | Settings (Notifications) | `/settings/notifications` | Notification prefs | Platform squad |
| 17 | Settings (Billing) | `/settings/billing` | Payment methods, invoices | Platform squad |
| 18 | Admin Dashboard | `/admin` | Multi-role overview | Admin squad |
| 19 | Admin Zones | `/admin/zones` | Manage zone definitions | Geo squad |
| 20 | Admin Providers | `/admin/providers` | Manage provider accounts | Admin squad |
| 21 | Admin Reports | `/admin/reports` | Export compliance & booking data | Admin squad |
| 22 | Auth Pages | `/login`, `/register`, `/forgot-password` | Authentication flows | Identity squad |
| 23 | Status Page (embedded) | `/status` | Service status embed | SRE |
| 24 | Error Pages | `/404`, `/500` | Error handling | Platform squad |

## Page Prioritisation
- Phase 1 (MVP): 1–7, 13, 15, 22, 24.
- Phase 2: 8–12, 16–18.
- Phase 3: 19–21, 23.

## Template Mapping
- Marketing pages share `MarketingLayout` (hero, cards, footer).
- Authenticated pages use `DashboardLayout` (sidebar + content).
- Admin pages extend `DashboardLayout` with top utility bar and environment indicator.
