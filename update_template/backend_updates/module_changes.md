# Module Changes

## Models
- Added `marketplaceTaxonomyDomain`, `marketplaceTaxonomyNode`, `marketplaceTaxonomyFacet`, and `marketplaceTaxonomyNodeFacet` models with associations in `src/models/index.js`.
- Added `serviceTaxonomyAssignment`, `rentalTaxonomyAssignment`, and `materialTaxonomyAssignment` models to map services, rental assets, and material sale profiles to taxonomy nodes.

## Scripts
- Created `scripts/taxonomy-integrity.mjs` to verify marketplace taxonomy data across environments and output rollback SQL when required.

## Tests
- Added `tests/marketplaceTaxonomySeed.test.js` covering blueprint immutability, checksum metadata, and facet assignment integrity for the new seed plan.
