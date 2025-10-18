# Fixnado Frontend

A Vite-powered React application styled with Tailwind CSS and the Inter font. The UI provides the foundation for the Fixnado on-demand services marketplace including live feeds, marketplace listings, escrow messaging, and admin controls.

## Getting started

```bash
cd frontend-reactjs
npm install
npm run dev
```

The dev server runs on http://localhost:5173

### Live dashboard data

Dashboards now default to using the live analytics APIs so that any integration or data issues are surfaced immediately. When 
working without the backend you can re-enable the mock fixtures by setting `VITE_DASHBOARD_FALLBACK_MODE` in your environment:

```bash
# .env.development.local
VITE_DASHBOARD_FALLBACK_MODE=dev-only
```

Accepted values are:

- `never` (default) – always use live APIs.
- `dev-only` – use mock dashboards only while running the Vite dev server.
- `always` – force the mocks regardless of environment.

## Available routes

- `/` – Landing page showcasing services, marketplace, service zones, escrow and live feed
- `/login` – 2FA-enabled login screen for users
- `/register` – Customer and service professional registration
- `/register/company` – Company / sole trader onboarding
- `/feed` – Live feed of jobs and marketplace activity
- `/profile` – Profile showcase with services and marketplace shop
- `/search` – Explorer search experience
- `/services` – Service purchase and marketplace overview
- `/admin` – Admin login
- `/admin/dashboard` – Admin control center

## Styling

Tailwind CSS is configured with a palette that matches the Fixnado logo. Inter font is loaded via Google Fonts in `src/styles.css`.

The official Fixnado logo and favicon are served from hosted assets to avoid bundling binary files in the repository. You can update
the URLs from `src/constants/branding.js` if new artwork is provided.
