# Migration Updates

## 2024-05-20 – 20250601000000-create-marketplace-taxonomy
- Creates `marketplace_taxonomy_domains`, `marketplace_taxonomy_nodes`, and `marketplace_taxonomy_facets` with JSONB metadata and checksum auditing.
- Adds `marketplace_taxonomy_node_facets` plus service/rental/material assignment tables enforcing cascading behaviour for catalogue entities.
- Provides transactional rollback and ENUM cleanup for `data_type` ensuring repeatable deployments across environments.
