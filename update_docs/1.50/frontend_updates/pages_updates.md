# Pages & Shell Updates – Version 1.50

## Consent Surfaces
- `App.jsx` now renders the global `ConsentBanner` directly beneath the routing shell, ensuring required policies block access until acknowledged.
- `main.jsx` registers the `ConsentProvider` alongside existing providers so downstream routes/components can request consent verification before executing privileged flows.
- Legal content JSON refresh aligns in-app copy with the latest policy versions emitted from the consent ledger service.

## Compliance Portal
- Added the `CompliancePortal` route with hero context, request submission form, filter chips, and actionable cards for exports/status management.
- Leveraged shared typography and card tokens to align with the dark themed compliance workspace and support enterprise screen widths.
- Introduced reusable `StatusBadge` styling with PropTypes validation to keep list views consistent and lint-clean.
