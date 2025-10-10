# Controllers – Version 1.00 Updates

## authController.js
- Introduced reusable validation error formatter and user serialization helper to standardise API payloads.
- Enforced transactional registration across `User` and `Company` models with conflict handling and normalised inputs.
- Sanitised `login` and `profile` responses to remove sensitive fields while exposing two-factor preferences and company metadata.
