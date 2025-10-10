# Routes – Version 1.00 Updates

## authRoutes.js
- Added strong password policy, company data, and age validation rules with descriptive error messaging for `/auth/register`.
- Normalised login inputs and ensured `/auth/login` responds with actionable validation feedback.
- Enforced company-specific payload validation (contact email, service regions) to prepare for compliance workflows.
