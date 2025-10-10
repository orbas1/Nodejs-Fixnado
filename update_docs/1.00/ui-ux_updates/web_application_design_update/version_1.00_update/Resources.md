# Resource Inventory — Web Application v1.00

## Asset Libraries
- **Icons**: `frontend-reactjs/packages/icons` (SVG). Export via `pnpm icons:build`.
- **Illustrations**: `design/illustrations/web/v1.00` (Figma + SVG exports). Maintained by Brand team.
- **Photography**: `assets/photography/operations` (internal license). Includes metadata (location, rights).
- **Maps**: Mapbox style `fixnado-zones-web-v7`, stored under organisation account.
- **Lottie Animations**: `assets/motion/` with JSON + fallback PNG.

## External Services
- Mapbox GL JS (v2.15) for mapping.
- ECharts (v5.5) for charts.
- Keen Slider (v6) for carousels.
- LaunchDarkly for feature flags.
- Sentry for error tracking.

## Documentation & References
- Figma file: `Fixnado Web Platform v1.00` (library + handoff pages).
- Notion workspace: `Product > Web Platform > v1.00` with research insights.
- Storybook: `https://ui.fixnado.internal/storybook` (requires VPN).

## API Endpoints
- GraphQL service `https://api.fixnado.com/graphql` for booking, analytics, settings.
- REST endpoints for compliance `/compliance`, chat `/chat`, CMS `/cms/content`.
- Websocket `wss://realtime.fixnado.com` for bookings/chat.

## Data Models
- `Zone`: { id, name, polygonGeoJSON, demandScore, providers[] }.
- `Provider`: { id, name, rating, certifications[], packages[] }.
- `Booking`: { id, status, serviceType, schedule, providerId, documents[] }.
- `Campaign`: { id, status, budget, zones[], performance }.

## Design Token Delivery
- Tokens exported as JSON, CSS variables, and TypeScript definitions from `packages/design-tokens`.
- Pipeline triggered via GitHub Actions `design-tokens-release.yml`.

## Testing Resources
- Accessibility: Axe DevTools, NVDA/VoiceOver checklists.
- Performance: WebPageTest profiles for 4G, Lighthouse CI pipeline.
- Browser Matrix: Chrome, Edge, Firefox (latest), Safari 16+, iOS Safari 16+, Android Chrome 12+.

## Stakeholders
- Product Design Lead: Riley Chen
- Front-end Lead: Mateo Alvarez
- Product Manager: Saanvi Rao
- QA Lead: Priya Desai

## Governance
- Weekly design critiques Tuesday 15:00 UTC.
- Design change approval requires sign-off from Design Lead + FE Lead.
- All assets versioned with semantic tags `v1.00.x`.
