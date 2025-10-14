# Dependency Pre-Update Evaluation – Version 1.50

## Functionality
- **High – Node.js engine misalignment**: Backend `package.json` files still target Node 18.17 while infrastructure plans reference Node 20 LTS images. Without aligning the engines field and CI runtime, production builds will diverge from local testing.
- **High – Core package lag**: Key packages (`express`, `sequelize`, `jsonwebtoken`, `axios`) remain multiple major versions behind, missing security and performance improvements that downstream teams expect for 1.50. Upgrading requires compatibility testing before code freeze.
- **Medium – Flutter dependency drift**: `google_fonts` and `intl` pins are manually curated, and `flutter pub get` will continue to fail when the SDK fetches transitive updates. We need automated resolution via `flutter pub upgrade --major-versions` and lockfile verification in CI.
- **Medium – Flutter SDK constraints stale**: `flutter-phoneapp/pubspec.yaml` still allows Dart SDKs from 3.3 upwards, so CI runners happily stay on 3.3.x even though the roadmap requires features landing in 3.7+. Tighten the lower bound to 3.7 and ensure tooling images match.
- **Medium – Frontend build tooling**: Vite, React Router, and TanStack Query versions differ from the roadmap that mandates suspense-ready routing. Aligning them is necessary to unlock server-driven UI experiments.
- **Low – Shared utility packaging**: `shared/` helpers are not published as internal packages, forcing consumers to rely on relative imports. Converting to npm workspaces will stabilise dependency consumption across repos.
- **Low – Redundant database drivers**: `backend-nodejs/package.json` ships both `pg` and `mysql2` plus SQLite bindings even though production targets Postgres. The unnecessary binaries increase install times and CVE surface area.

## Usability
- **High – Installation determinism lacking**: The monorepo mixes npm, pnpm, and yarn instructions. Contributors are unsure which lockfile to respect, leading to inconsistent dependency graphs. Standardise on npm workspaces with a single root lockfile and preflight checks.
- **Medium – Toolchain documentation gaps**: Required global tooling (`firebase-tools`, `aws-cli`, `terraform`, `dart`) is undocumented. Engineers discover missing binaries only after CI failures. Expand onboarding docs with version matrices and verification scripts.
- **Medium – Engine declarations missing**: Neither `backend-nodejs/package.json` nor `frontend-reactjs/package.json` declares a supported `engines.node` range, so package managers do not warn when developers run outdated runtimes. Add explicit `>=20.x` constraints once the upgrade lands.
- **Medium – Cache strategy absent**: CI jobs rebuild `node_modules` and `~/.pub-cache` from scratch. Introducing dependency caching keyed by lockfiles will shrink feedback loops and cost.
- **Medium – Binary dependency pain**: Native modules (`sharp`, `better-sqlite3`) fail to install on Apple Silicon due to missing prebuilt binaries. Provide documented fallbacks or optional prebuild caches.
- **Low – License visibility**: Legal review is manual. Provide automated license scanning output (e.g., `license-checker`) during `npm run audit` to accelerate approvals.
- **Low – Lockfile sprawl**: Separate `backend-nodejs/package-lock.json` and `frontend-reactjs/package-lock.json` drift independently, so Renovate cannot guarantee aligned versions. Moving to a root workspace lock will simplify onboarding and caching.

## Errors
- **High – Peer dependency conflicts**: React app installs continue to emit Tailwind/PostCSS peer warnings, masking legitimate errors during development. Upgrade the PostCSS chain or pin compatible versions to clean the signal.
- **Medium – Native build failures**: Optional dependencies that require compilation (`sharp`) frequently fail in CI when build toolchains are unavailable. Define `optionalDependencies` properly and document prerequisites.
- **Medium – Supply chain risk**: Lack of lockfile integrity checking allows tampered packages to slip in. Enable `npm ci --ignore-scripts=false` with signature enforcement and integrate `npm audit signatures`.
- **Low – License conflicts**: Analytics libraries with GPL-style clauses are present. Without early legal clearance, we risk remediation work late in the release.
- **Low – Deprecation warnings**: Several dependencies emit Node 20 deprecation warnings (e.g., `uuid` v3). Upgrading proactively will avoid runtime errors when Node 20 becomes mandatory.
- **Low – Legacy Babel remnants**: `frontend-reactjs/package.json` still depends on `@testing-library` suites that drag in Babel 7, conflicting with the Vite 6 toolchain and slowing test cold starts.

## Integration
- **High – Monorepo coordination issues**: Without npm workspaces, the same dependency appears in multiple versions across services, leading to duplicated code and inconsistent behaviour. Adopt hoisting with workspace protocol references.
- **Medium – Shared utilities packaging**: `shared/` TypeScript helpers are not versioned. Publishing them as an internal package enables semantic versioning and dependency tracking for web and mobile clients.
- **Medium – Infrastructure automation**: Terraform and Ansible scripts lack pinned provider versions. Running `terraform init` months later yields drift. Lock providers and modules via `.terraform.lock.hcl` to stabilise deployments.
- **Medium – Observability tooling**: Logging, tracing, and metrics libraries differ across services (pino vs winston vs console). Adopt a standard instrumentation stack and share configuration packages.
- **Low – Data pipeline connectors**: Dependencies for analytics ingestion (`@aws-sdk/*`, Kafka clients) are absent even though the roadmap calls for them. Define selection criteria and spike integration during the next sprint.

## Security
- **High – Vulnerability backlog**: `npm audit` still reports moderate/high CVEs for `jsonwebtoken`, `axios`, and `lodash`. Prioritise upgrading or patching before release candidate builds.
- **High – Lack of provenance controls**: There is no private registry mirror, dependency signing, or checksum verification. Introduce Artifactory/Nexus proxies with allowlists and use `npm config set audit-signature true` to enforce integrity.
- **Medium – SBOM coverage missing**: No SBOM is generated for Node or Flutter artifacts. Adopt `cyclonedx-npm` and `cyclonedx-gomod` (for backend scripts) plus `cyclonedx-dart` to supply procurement documentation.
- **Medium – Secrets in dependencies**: Some third-party SDKs embed instrumentation keys directly in config files. Audit dependencies to ensure we do not ship credentials from sample apps.
- **Low – Update cadence policy**: There is no documented policy for how quickly dependencies must be updated after releases. Establish SLAs (e.g., critical updates within 7 days) to maintain security posture.

## Alignment
- **High – Roadmap dependency readiness**: Planned analytics dashboards require AWS SDK v3 clients and event streaming libraries which are currently missing. Without onboarding these dependencies early, service integration will slip.
- **Medium – Mobile platform alignment**: Flutter’s roadmap requires migrating to Dart 3.7+ while the CI image ships Dart 3.6. Coordinate with DevOps to upgrade CI/container images before bumping constraints.
- **Medium – Policy compliance**: Enterprise procurement requires SPDX license manifests and security attestations. Without automated tooling, we cannot satisfy audits tied to the 1.50 release.
- **Low – Third-party contract obligations**: Vendor SLAs (Twilio, SendGrid) require us to stay within supported SDK versions. Track vendor announcements and align upgrade plans with contract milestones.
- **Low – Observability initiatives**: Platform engineering expects unified telemetry libraries to enable cross-service tracing. Dependency workstreams must align with that initiative to avoid rework post-release.
