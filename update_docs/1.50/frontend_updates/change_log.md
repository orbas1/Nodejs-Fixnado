# Frontend Change Log – Version 1.50

## 2025-03-18 – Consent Experience & Legal Copy Refresh
- Added `ConsentProvider`, hook (`useConsent`), and banner component orchestrating consent snapshot retrieval, acknowledgement, and verification with anonymous subject persistence.
- Wired the provider into `App.jsx`/`main.jsx`, updated API clients, and refreshed `uk_terms.json` + `privacy_policy_content.json` to surface the revised legal copy from the consent ledger.
- Introduced `consentClient` with typed error handling plus ESLint clean-up across existing API utilities to keep shared fetch helpers warning-free.
