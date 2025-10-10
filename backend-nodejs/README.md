# Fixnado Backend API

Node.js (Express) REST API with Sequelize (MySQL) powering the Fixnado service marketplace, escrow, and marketplace experiences.

## Getting started

```bash
cd backend-nodejs
npm install
cp .env.example .env
npm run dev
```

The API runs on http://localhost:4000

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

## Database tooling

Use Sequelize CLI or your preferred migration runner to execute files in `src/database/migrations` and `src/database/seeders`. The provided `sql/install.sql` bootstraps the MySQL database and service accounts.
