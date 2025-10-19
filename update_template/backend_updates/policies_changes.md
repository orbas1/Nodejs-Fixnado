# Policy Catalogue Updates – Version 1.00 UT-004

- Added timeline hub policy entries (`timeline.hub.read`, `timeline.hub.moderate`, `timeline.support.session`) in `backend-nodejs/src/policies/routePolicies.js` mapping to existing permission scopes.

# Policy Catalogue Updates – Version 1.00 UT-005

- Added `commerce.snapshot.read` and `commerce.persona.dashboard` policies to gate the new commerce APIs behind `analytics:overview` permissions while capturing persona metadata for audit logs.

# Policy Catalogue Updates – Version 1.00 UT-006

- Added `compliance.data-requests.metrics` policy so DSAR backlog analytics are restricted to compliance portal operators and auditable by region filter usage.
