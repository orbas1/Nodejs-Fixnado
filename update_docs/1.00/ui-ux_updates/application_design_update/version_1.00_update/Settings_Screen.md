# Settings Screen Detailed Spec — Phone Application v1.00

## Layout
- Scrollable `CustomScrollView` with `SliverList` sections.
- Header: Title `Manrope 22/30`, subtitle `Inter 15/22` "Manage your Fixnado experience".
- Section headers pinned using `SliverPersistentHeader` height 40dp.
- Each tile uses `FixnadoListTile` (height 72dp) with icon 28dp in 40dp container, trailing indicator (toggle, chevron, text).

## Sections & Items
1. **Account**
   - Profile Info (chevron) → Profile Detail.
   - Contact Info (chevron) → Contact edit.
2. **Preferences**
   - Language (chevron) shows current locale (e.g., EN).
   - Currency (chevron) shows selected currency (USD/EUR).
   - Measurement Units (segmented toggle `Metric/Imperial`).
   - Reduce Motion (switch).
   - Theme (switch `Light/Auto/Dark` via dialog).
3. **Notifications**
   - Push Notifications (switch) + description.
   - Email Updates (switch).
   - SMS Alerts (switch disabled if phone not verified).
   - Booking Reminders (switch).
   - Promotions (switch, default off for providers).
4. **Security**
   - Change Password (chevron).
   - Two-Factor Authentication (switch with status pill `Enabled/Disabled`).
   - Login History (chevron) -> modal with list of sessions.
5. **Support**
   - Help Center (chevron) -> Support Centre screen.
   - Submit Ticket (chevron) -> opens form.
   - Legal & Policies (chevron) -> Webview.
6. **Danger Zone**
   - Sign Out (button, ghost style with red text).
   - Delete Account (destructive button with confirmation modal).

## Visual Styling
- Background `#F7F9FC`, cards white.
- Icons tinted `#0066F5` except Danger zone `#E74C3C`.
- Dividers between items `rgba(17,24,39,0.08)` 1dp full width.

## Interaction Specs
- Switch toggles animate 120ms. Disabled state greyed out.
- Press on tile triggers ripple + navigation.
- Danger buttons show confirm dialog (title `Are you sure?`, message detail).

## Accessibility
- Provide `Semantics` grouping by section with descriptive labels.
- Switches accessible names e.g., "Push notifications" with state.
- Danger zone buttons flagged as `isDestructiveAction`.

## Analytics
- Track event `settings_item_opened` with `item_id` (e.g., `language`, `notifications_push`).
