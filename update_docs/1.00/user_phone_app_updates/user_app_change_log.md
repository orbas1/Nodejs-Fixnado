# User App Change Log — 2025-02-09

- Enhanced live feed widget to support loading indicators, empty state messaging, and high-priority flagging, matching menu/dashboard drawings for Subtask 6.2 readiness.
- Introduced widget tests ensuring render paths and retry callbacks behave consistently, enabling CI adoption once Flutter tooling is provisioned.

## 2025-10-21 — Booking & Rental Controller Parity QA
- Added Riverpod controller unit tests for bookings and rentals (`test/features/bookings/booking_controller_test.dart`, `test/features/rentals/rental_controller_test.dart`) to exercise cached refresh fallback, offline banner propagation, and lifecycle actions (create, schedule, inspection) per `App_screens_drawings.md` and `Screens_Update_Logic_Flow.md` requirements.
- Verified `_DateField` behaviour in `lib/features/rentals/presentation/rental_screen.dart` so optional time selection defaults and UTC conversions mirror inspection scheduling notes across admin/provider dashboards, closing pre-update evaluation feedback about rental sheet regressions.
