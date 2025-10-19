# Backend Change Log

## 2024-05-20 – Marketplace Taxonomy & Verification
- Added marketplace taxonomy domain/node/facet models with associations for services, rental assets, and material sale profiles.
- Registered deterministic seed blueprint test (`marketplaceTaxonomySeed.test.js`) to guard blueprint regressions.
- Introduced taxonomy integrity CLI for checksum verification and rollback SQL emission.
