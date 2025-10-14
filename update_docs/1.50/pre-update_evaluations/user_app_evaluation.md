# User App (Mobile) Pre-Update Evaluation – Version 1.50

## Functionality
- **High – Feature coverage gaps**: The Flutter client still mirrors the 1.00 feature set. There are no components for regional marketplace filters, compliance badges, or dispute resolution flows. Without these screens the mobile app cannot ship with 1.50 parity.
- **High – Push notification incompleteness**: Firebase Cloud Messaging setup captures device tokens but never syncs them with the backend or subscribes to topic channels. Notifications, escalations, and campaign alerts will not reach users.
- **Medium – Offline experience limitations**: Hive-based caching only persists the current session. Saved jobs, messages, and inspections disappear once the app restarts. Implement background sync and selective offline caching for critical data.
- **Medium – Observability instrumentation**: There is no Crashlytics/Sentry integration. Crash diagnostics depend on user reports, impeding rapid support response.
- **Low – Feature flag readiness**: Remote config is absent. Features are hardcoded via constants, making staged rollouts impossible.
- **Low – Navigation destinations incomplete**: `lib/app/app.dart` defines a blog tab in `_NavigationDestination` but never surfaces it to the bottom navigation, signalling design drift and confusing stakeholders reviewing parity.

## Usability
- **High – Onboarding friction**: Registration spans six screens without progress indicators or inline validation. Drop-off rates are high in analytics. Introduce progressive disclosure, inline validation, and auto-fill support.
- **Medium – Navigation inconsistency**: Bottom navigation mixes tab and stack paradigms, breaking Android back-button expectations. Adopt a single navigation strategy (e.g., Navigator 2.0 with deep link support) and ensure screen titles reflect hierarchy.
- **Medium – Accessibility gaps**: Dynamic type support is inconsistent; large text causes overflow in cards and buttons. Screen readers mislabel interactive elements. Conduct a11y audits and align with Material 3 guidelines.
- **Medium – Input ergonomics**: Forms lack field masks and helper text, especially for financial details. Add formatting for currency, phone numbers, and addresses to reduce errors.
- **Low – Visual parity**: The theme still uses 1.00 colours and typography. Refresh to match the updated brand kit and align with web.
- **Low – Provider noise**: `lib/app/bootstrap.dart` enables verbose provider logging whenever `enableProviderLogging` is set, printing in release builds and cluttering support logs. Gate behind debug assertions and ship structured logging instead.

## Errors
- **High – Runtime crashes on Android 14**: The analytics plugin crashes due to missing notification channel metadata and outdated Gradle configuration. Without patching, Google Play submissions will fail review.
- **Medium – Network error handling**: HTTP failures surface as generic snackbars. Provide actionable error states with retry/backoff and offline cues to avoid repeated support tickets.
- **Medium – Build warnings**: `flutter analyze` flags deprecated theming APIs (`ThemeData.primaryColor`) and insecure HTTP overrides. Address these to ensure forward compatibility.
- **Low – Logging gaps**: There is minimal structured logging around API failures. Introduce logging wrappers to capture request IDs and response codes for support triage.
- **Low – Testing coverage**: Widget/integration tests cover legacy flows only. Add golden tests and integration tests for new marketplace features once built.
- **Low – Dead enum paths**: `_NavigationDestination.blog` is never reachable, so regressions will slip past widget tests and localisation may ship unused copy. Remove or wire the destination before feature freeze.

## Integration
- **High – Backend parity issues**: The app consumes legacy REST endpoints and ignores new GraphQL/REST expansions planned for 1.50. Ensure HTTP clients support both and handle token refresh gracefully.
- **Medium – Feature flag/remote config**: There is no runtime configuration mechanism (Firebase Remote Config, LaunchDarkly). Without it we cannot gradually roll out compliance or escrow features.
- **Medium – Analytics schema drift**: Event names differ from web, complicating reporting. Adopt shared analytics constants and ensure payloads conform to updated schemas.
- **Medium – Payment provider integration**: In-app payments rely on deprecated SDK versions and lack 3DS2 support. Upgrade SDKs and verify backend compatibility before expanding to new regions.
- **Low – Map/geolocation services**: Location services use permissive settings that fail App Store review (background location without justification). Update permission prompts and limit background usage.
- **Low – Config fallback exposure**: `lib/app/bootstrap.dart` seeds `AuthTokenStore` with `config.demoAccessToken`. Unless revoked per environment, stale demo tokens may grant unintended access when cached on devices.

## Security
- **High – Credential storage risk**: Tokens persist in shared preferences. Migrate to `flutter_secure_storage` with biometric unlock for sensitive actions and ensure tokens refresh frequently.
- **Medium – Device integrity checks**: There is no root/jailbreak detection. Add lightweight detection and gating for high-risk features like escrow releases.
- **Medium – Transport security**: HTTP client accepts self-signed certificates for staging but never tightens TLS in production builds. Implement environment-specific certificate pinning and strict TLS settings.
- **Low – Privacy governance**: Consent management for analytics and push notifications is minimal. Implement fine-grained consent toggles aligned with GDPR/CCPA obligations.
- **Low – Logging hygiene**: Debug logs include personally identifiable information. Strip PII before shipping release builds.
- **Low – Demo token leakage**: The fallback token path in `AuthTokenStore` logs errors with token prefixes for debugging. Scrub the output to avoid leaking credentials into shared logs.

## Alignment
- **High – Roadmap commitments**: Mobile parity for compliance review, escrow messaging, and analytics dashboards is absent. Without mobile support, the release narrative fails enterprise expectations.
- **Medium – Design system alignment**: Visual language and components lag behind the refreshed web design. Synchronise tokens, iconography, and motion guidelines across platforms.
- **Medium – Performance targets**: Cold start exceeds 3s on mid-tier Android hardware. Profile startup, leverage deferred loading, and prefetch essential data.
- **Low – Support tooling**: Customer support workflows require device logs and reproduction steps. Integrate remote logging or support SDKs to capture session data securely.
- **Low – Localization readiness**: Localization files only cover English. Prepare translation infrastructure for new locales introduced on web to maintain parity.
