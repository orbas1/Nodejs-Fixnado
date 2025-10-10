# Fixnado Frontend

A Vite-powered React application styled with Tailwind CSS and the Inter font. The UI provides the foundation for the Fixnado on-demand services marketplace including live feeds, marketplace listings, escrow messaging, and admin controls.

## Getting started

```bash
cd frontend-reactjs
npm install
npm run dev
```

The dev server runs on http://localhost:5173

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
