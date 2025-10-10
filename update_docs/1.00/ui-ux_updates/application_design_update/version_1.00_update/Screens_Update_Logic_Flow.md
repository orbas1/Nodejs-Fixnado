# Screen Logic Flow — Phone Application v1.00

This document maps user intents to the screen stack transitions. It complements `Logic_Flow_update.md` by focusing on screen-level navigation and conditional rendering.

## 1. Authentication Funnel
1. Launch → Splash (3s minimum display while auth token check runs).
2. **If** stored token valid + compliance status approved → Navigate to `ExploreHome` (Provider or User variant based on role flag).
3. **Else** show Login.
   - Login success triggers: fetch profile, fetch zone context, pre-load bookings; route to Onboarding if `profileComplete=false`.
   - Forgot password pushes `PasswordReset` (webview) and returns to Login on success.
4. Onboarding carousel uses `Navigator.pushReplacement` to `PermissionsRequest` when user taps "Get Started".

## 2. Explore Flow
- `ExploreHome` houses `NestedScrollView` with map + bottom sheet list.
- Filter icon opens modal `FilterDrawer` (full screen). On apply, closes modal, triggers Riverpod provider refresh, updates map + list simultaneously.
- Selecting provider card uses `showModalBottomSheet` -> `ProviderDetailSheet`. CTA `Book Now` pushes `BookingStep1`. CTA `Chat` opens `Conversation` (chat module).
- Search field transitions to `SearchResultsPage` (list-first layout). Map button toggles `MapFirst` boolean; state persists via `SharedPreferences`.

## 3. Booking Wizard
- `BookingStep1` collects package + add-ons. Next button validates selections (requires package + schedule). Success -> `BookingStep2` (details & address). Back button pops to `ProviderDetailSheet` retaining state.
- `BookingStep3` payment: integrates with `PaymentSheet` (Stripe). On success event, route to `BookingSuccess`. On failure, display inline error with retry.
- `BookingSuccess` has `View Booking` -> `BookingDetail` screen (tab under Bookings). Back to Explore pops to root using `Navigator.popUntil((route) => route.isFirst)`.

## 4. Marketplace
- `MarketplaceHome` uses `DefaultTabController`. Each tab lazy loads content via Riverpod `FutureProvider`. Pull-to-refresh resets provider.
- Campaign cards navigate to `CampaignDetail`. CTA `Activate Promotion` opens `PromotionWizard` (three-step overlay). If user lacks subscription, show paywall sheet referencing `Settings` for upgrade.

## 5. Messaging
- `MessagesList` listens to websocket status; offline fallback shows banner.
- Tapping conversation pushes `ChatDetail`. Compose input triggers `TypingIndicator` event after 300ms of keystroke idle.
- Attachment button -> bottom sheet with `Camera`, `Gallery`, `Document` options; selection opens respective native intents.

## 6. Profile & Settings
- `ProfileOverview` list tiles navigate to nested routes using `Navigator.push` with slide transition 280ms.
- `DocumentsVault` uses hero animation for document thumbnails when expanded to preview (modal). Upload uses `FilePicker`, upon success triggers `SnackBar` confirmation.
- `Settings` toggles update remote config via API and update local state. Danger actions (Delete account, Sign out) show confirmation dialog with destructive theming.

## 7. Provider Dashboard & Compliance
- Provider roles flagged via `profile.role`. `ProviderDashboard` accessible from main nav; uses `BottomNavigationBar` entry.
- Quick actions use context-specific routing: e.g., `Start Job` -> `ActiveJobDetail`; `Log Availability` -> `CalendarAvailability`.
- `ComplianceCenter` organizes tasks by due date. Upload success updates progress and triggers `ProviderDashboard` refresh when returning.

## 8. Notifications
- Accessed via bell icon; uses `Navigator.of(context).push` with fade transition 200ms.
- Swiping item triggers `Dismissible` callbacks updating backend. Tapping opens context-specific screen (booking detail, compliance item) via dynamic link mapping.

## 9. Offline/Error Handling
- On network loss, `ConnectivityProvider` toggles offline banner; certain actions disabled (buttons greyed). Retry button re-attempts fetch using exponential backoff.
- Global error dialog uses `showDialog` with `FixnadoErrorDialog` component. For authentication failures, user redirected to Login with message.

## Navigation Shells
- Primary navigation via `FixnadoBottomNav` (5 tabs). Each tab maintains own `Navigator` stack using `IndexedStack` for state retention.
- Deep links (notifications, universal links) use route parser: `/booking/:id` -> Bookings tab with detail; `/promotion/:id` -> Marketplace tab with campaign overlay.
