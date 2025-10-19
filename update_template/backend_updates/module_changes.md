# Module Changes

## Models
- Normalised campaign advertising models (`campaignCreative`, `campaignAudienceSegment`, `campaignPlacement`) with shared database import, enum constants, metadata sanitisation hooks, and index definitions supporting vitest bundler usage.
- Added `marketplaceTaxonomyDomain`, `marketplaceTaxonomyNode`, `marketplaceTaxonomyFacet`, and `marketplaceTaxonomyNodeFacet` models with associations in `src/models/index.js`.
- Added `serviceTaxonomyAssignment`, `rentalTaxonomyAssignment`, and `materialTaxonomyAssignment` models to map services, rental assets, and material sale profiles to taxonomy nodes.
- Renamed admin profile/tax filing associations in `src/models/index.js` (`adminUserProfile`, `delegateRecords`, `documentRecords`) to eliminate Sequelize alias collisions with JSON attributes.

## Scripts
- Created `scripts/taxonomy-integrity.mjs` to verify marketplace taxonomy data across environments and output rollback SQL when required.

## Tests
- Added `tests/marketplaceTaxonomySeed.test.js` covering blueprint immutability, checksum metadata, and facet assignment integrity for the new seed plan.

## Migrations
- Added `20250605000000-add-launch-readiness-legal-documents.js` seeding refund policy, community guidelines, about, and FAQ legal documents with acknowledgement metadata, governance audit trail references, and attachments for compliance sampling.
