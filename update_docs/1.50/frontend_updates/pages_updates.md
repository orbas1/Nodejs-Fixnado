# Pages & Shell Updates – Version 1.50

## Consent Surfaces
- `App.jsx` now renders the global `ConsentBanner` directly beneath the routing shell, ensuring required policies block access until acknowledged.
- `main.jsx` registers the `ConsentProvider` alongside existing providers so downstream routes/components can request consent verification before executing privileged flows.
- Legal content JSON refresh aligns in-app copy with the latest policy versions emitted from the consent ledger service.
