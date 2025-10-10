# Dependency Evaluation – Version 1.00

## Functionality
- Backend depends on Express, Sequelize, and MySQL but omits supporting libraries for migrations/seeding orchestration in production (Sequelize CLI, dotenv-safe), so automated provisioning is unsupported (`backend-nodejs/package.json`).
- Front-end stack includes Tailwind, Heroicons, and Router yet lacks state/query libraries (React Query, Redux) needed to manage the rich data interactions promised by the UI, making real data integration difficult (`frontend-reactjs/package.json`).
- Flutter app references `http` and `google_fonts`, but there is no dependency for secure storage, push notifications, or analytics, limiting the mobile experience to static screens (`flutter-phoneapp/pubspec.yaml`).

## Usability
- Backend repository ships without a lockfile, so installs are nondeterministic across environments and increase “works on my machine” risk during onboarding (`backend-nodejs`).
- Monorepo lacks a dependency management strategy; each app manages versions independently with no documentation on Node/Flutter toolchain requirements beyond defaults, leading to environment drift.
- There are lint scripts but no formatters or pre-commit hooks configured, so contributors must manually maintain style consistency across JavaScript and Dart codebases.

## Errors
- Absence of runtime validation libraries (e.g., Zod/Joi) forces scattered validator usage and increases the chance of silent schema drift or runtime crashes when upstream services change payload shape.
- No dependency vulnerability scanning (npm audit, `dart pub outdated`) is configured, so outdated packages can slip into releases without alerting the team.
- Node services rely on optional peer dependencies (`@types/*`) for TypeScript tooling even though the project is JavaScript-only; this increases the chance of mismatched type definitions when IDEs attempt to infer types.

## Integration
- There is no shared configuration or package workspace linking backend and frontend versions of shared packages (e.g., axios vs. backend JSON contract), which complicates synchronized upgrades.
- External service integrations implied by product positioning (payments, 2FA, messaging) are absent from dependency trees, signaling that major features cannot be integrated without significant new packages.
- Flutter app does not include platform-specific plugins (geolocation, camera, file picker) necessary for the on-demand service workflows showcased elsewhere, so cross-platform parity is unachievable.

## Security
- Default dependencies (Express 4.x, Sequelize 6.x) require frequent patching, but without automation or pinned lockfiles the project is exposed to supply-chain vulnerabilities as soon as npm publishes advisories.
- JWT handling depends on `jsonwebtoken` without complementary libraries for key rotation or JWK support, pushing the team toward hard-coded symmetric secrets that are harder to secure.
- Front-end includes Axios but stores no interceptors or CSRF protection libraries, making it easy to accidentally leak tokens or skip request hardening when integration work begins.

## Alignment
- Dependency selections do not reflect the enterprise-ready claims (no observability, feature flagging, or experimentation libraries), indicating a misalignment between marketing promises and technical groundwork.
- There is no documentation on version support matrices (Node, npm, Flutter SDK), so stakeholders cannot align release pipelines across teams.
- Shared design language between web and mobile is implied, yet there is no mono-repo package (e.g., component library) that enforces consistency, increasing divergence risk over time.
