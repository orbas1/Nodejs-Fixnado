# Fixnado Backend API

Node.js (Express) REST API with Sequelize (MySQL) powering the Fixnado service marketplace, escrow, and marketplace experiences.

## Prerequisites

- Node.js 20.11.x (LTS) with npm 11.4.x activated via Corepack.
- PostgreSQL 15+ with PostGIS available when running geospatial migrations.
- Redis (optional) for rate limiter state if deploying beyond the in-memory dev profile.

Enable the pinned npm toolchain once per machine:

```bash
corepack prepare npm@11.4.2 --activate
```

## Getting started

```bash
cd backend-nodejs
npm ci
cp .env.example .env
npm run dev
```

The API runs on http://localhost:4000. Run the shared tooling guard before committing to confirm your environment matches the enforced baselines:

```bash
node ../scripts/verify-toolchains.mjs
```

## Project structure

```
src/
  app.js                 Express app setup
  server.js              Entry point
  config/                Environment & database configuration
  middleware/            Authentication and error middleware
  controllers/           Route handlers
  services/              Business logic and reusable queries
  models/                Sequelize models
  routes/                API route definitions
  database/migrations    Sequelize migrations
  database/seeders       Seed data
sql/install.sql          MySQL bootstrap script
```

## API overview

- `POST /api/auth/register` – Register user/company/servicemen accounts
- `POST /api/auth/login` – Login and receive JWT
- `GET /api/feed/live` – Live job posts
- `GET /api/feed/marketplace` – Marketplace feed
- `GET /api/services` – List services
- `POST /api/services` – Create service (servicemen & companies)
- `POST /api/services/:serviceId/purchase` – Create escrow-backed order
- `GET /api/search` – Explorer search across services & marketplace items
- `GET /api/admin/dashboard` – Admin dashboard metrics (company accounts)
- `GET /api/admin/platform-settings` – Retrieve commission, subscription, and integration settings
- `PUT /api/admin/platform-settings` – Update commission, subscription, and integration settings
- `POST /api/admin/platform-settings/test` – Run connectivity diagnostics for SMTP, storage, and integrations
- `GET /api/admin/platform-settings/audit` – Review and filter system setting diagnostic events with metadata

## Environment configuration

Key environment variables surfaced through the monetisation settings surface:

- `FINANCE_COMMISSION_RATES` – JSON map of default commission rates.
- `SUBSCRIPTIONS_ENABLED` – Toggle subscription enforcement (`true` by default).
- `SUBSCRIPTIONS_ENFORCE_FEATURES` – Require feature gating when subscriptions are enabled.
- `SUBSCRIPTIONS_DEFAULT_TIER` / `SUBSCRIPTIONS_DEFAULT_TIERS` – Seed subscription tier metadata.
- `SUBSCRIPTIONS_RESTRICTED_FEATURES` – JSON array of feature keys guarded by subscriptions.
- `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_ACCOUNT_ID` – Stripe credentials.
- `ESCROW_API_KEY`, `ESCROW_API_SECRET`, `ESCROW_ENVIRONMENT` – Escrow.com credentials.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_SECURE` – SMTP configuration.
- `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET`, `CLOUDFLARE_R2_PUBLIC_URL`, `CLOUDFLARE_R2_ENDPOINT` – Cloudflare R2 credentials.
- `APP_NAME`, `APP_URL`, `SUPPORT_EMAIL` – Application metadata propagated to the admin experience.
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL` – Database connection configuration.

## Database tooling

Use Sequelize CLI or your preferred migration runner to execute files in `src/database/migrations` and `src/database/seeders`. Preload the CommonJS environment shim so legacy tooling mirrors the application boot sequence:

```bash
node -r ./scripts/register-env.cjs ./node_modules/.bin/sequelize db:migrate
```

The provided `sql/install.sql` bootstraps the MySQL database and service accounts.
