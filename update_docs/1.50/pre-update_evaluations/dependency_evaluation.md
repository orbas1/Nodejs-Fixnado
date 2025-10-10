# Dependency Evaluation – Version 1.50

## Functionality
- Backend depends on `express`, `sequelize`, and `mysql2`, but there is no migration tooling or seeding scripts included (no `sequelize-cli` or Prisma-like layer). This limits our ability to evolve the schema alongside releases and leaves the SQL install script manually managed.
- Frontend uses plain `axios` without interceptors or an abstraction layer. There is no shared client for attaching auth headers, handling refresh tokens, or centralizing base URLs, so future API integrations will duplicate logic or diverge between views.
- Flutter app pulls in `http` but never wires it into repositories or services; all screens use static content. The dependency adds weight without delivering actual network functionality.

## Usability
- Package scripts are minimal (`start`, `dev`, `lint`) and lack combined workflows (e.g., `test`, `typecheck`). Developers must remember to run linting manually, and there are no Husky/pre-commit hooks to enforce consistency.
- There is no `.nvmrc` or engines field to communicate the required Node version. Given Sequelize v6 and Vite v5 both require Node 18+, onboarding engineers may install incompatible Node LTS versions and encounter cryptic runtime errors.
- The Flutter project does not lock plugin versions via a `pubspec.lock` check-in, reducing reproducibility for QA.

## Errors
- Dependency updates are unmanaged. Both `backend-nodejs` and `frontend-reactjs` have no Renovate/Dependabot configuration, so security patches rely on manual tracking. For example, `axios 1.6.7` lacks recent SSRF fixes introduced in 1.6.8+, and `jsonwebtoken` 9.0.2 has open advisories recommending strict algorithm whitelisting.
- `mysql2` 3.9.1 combined with Sequelize’s default pool settings is known to surface `PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR` when connections drop; without `mysql2` instrumentation or retry helpers, transient network issues will cause crashes.
- No dependency health monitoring exists for the Flutter app; `google_fonts` 6.x occasionally breaks caching on iOS 17 unless pinned to patch releases, but we have no guardrails.

## Integration
- There is no monorepo tooling (Nx, Turborepo) or shared workspace configuration, so dependencies duplicated across packages (eslint configs, React versions) are managed independently. This increases drift between applications.
- Environment variable handling differs per stack: the backend uses `dotenv`, the frontend relies on Vite’s `import.meta.env`, and Flutter has nothing. Without a unified secrets strategy, integrating across environments (dev/staging/prod) will produce mismatched feature toggles.
- Backend logging depends on `morgan` while frontend has no observability dependencies (e.g., Sentry SDK). Integrating cross-cutting telemetry will require additional dependency planning.

## Security
- Default secrets are hardcoded in config (JWT secret, DB credentials), inviting accidental deployment with insecure values. There is no secret scanning or commit hooks to prevent this.
- Dependencies that touch security-sensitive flows (e.g., `bcrypt`, `jsonwebtoken`) are used directly without wrappers that enforce options like `issuer`, `audience`, or password complexity checks, increasing the risk of misuse by downstream code.
- The absence of automated vulnerability scanning (npm audit, `flutter pub outdated --mode=null-safety`, etc.) leaves us blind to CVEs. No lockfile integrity checks (`npm ci`, `--frozen-lockfile`) are enforced in CI because there is no CI configuration attached to these dependencies.

## Alignment
- Tooling choices are inconsistent with the enterprise positioning: there is no message queue client, no observability SDK, no analytics library, and no state management beyond React hooks or Flutter stateful widgets. Dependencies do not support the “mission-critical operations” story marketed in the UI.
- Mobile/web/backend stacks share no common schema or DTO library, so alignment on API contracts will drift. Introducing something like `zod`/`io-ts` or generated TypeScript/Flutter models would improve fidelity, but none are present.
- Without infrastructure-as-code or containerization dependencies, ops alignment is weak; each app assumes local execution instead of deployment-ready dependency stacks expected for a 1.50 enterprise release.
