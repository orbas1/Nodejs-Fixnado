# User Phone App Change Log

## Diagnostics pipeline overhaul (Version 1.00)
- Upgraded the Flutter diagnostics reporter to hash device identifiers, attach runtime build metadata, and stream crash reports to `/v1/telemetry/mobile-crashes` with exponential backoff and payload trimming, ensuring parity with backend retention policies.【F:flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart†L1-L254】【F:flutter-phoneapp/lib/core/config/app_config.dart†L1-L89】
