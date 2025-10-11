# Settings Architecture — Phone Application v1.00

## Structure
- Settings accessible from Profile tab and bottom navigation (Settings icon for providers).
- Organised into sections: Account, Preferences, Notifications, Security, Support, Danger Zone.

## Data Model
| Section | Fields | Endpoint |
| --- | --- | --- |
| Account | name, email, phone, address | `/users/:id` PATCH |
| Preferences | language, currency, measurement units, reduced motion, theme | `/users/:id/preferences` |
| Notifications | push, email, SMS toggles for booking updates, promotions, compliance | `/users/:id/notifications` |
| Security | password update, MFA toggle, login history | `/users/:id/security` |
| Marketplace Compliance | insurance policy status, badge visibility, renewal reminders | `/marketplace/policies/:id`, `/marketplace/badge-visibility` |
| Support | link to Support Centre, documentation, contact | static + `/support/ticket` |
| Danger Zone | delete account, sign out | `/users/:id/deactivate`, `/auth/logout` |

## Interaction Rules
- Each toggle updates API immediately. Show inline spinner during call.
- Language change triggers app restart prompt with `Dialog`.
- Theme toggle immediate effect; persisted in shared preferences + backend flag.
- Insured seller badge toggle runs optimistic update; if backend rejects due to expired policy, revert and show inline alert with `View policy` CTA.
- Delete account requires 2-step confirmation (password + typed confirmation).
- Provide undo Snackbar for non-critical preference changes (e.g., promotions opt-out) lasting 6s.
- Show success toast for saved updates (`"Settings updated"`).
- For unsupported actions offline, grey out tile and show tooltip `"Connect to the internet to change this."`.

## Layout
- Use grouped list: header label (uppercase) + `FixnadoListTile`. Danger zone card with red border, destructive button.
- Provide `View more` link for Security -> opens login history modal (list of last 10 logins).
- Marketplace compliance card positioned below Security when provider role detected. Card height 180dp with badge illustration, status chip (Approved/Expiring/Expired), and CTA buttons `Review documents` and `Request renewal review` (primary).
- Rental preferences subsection includes default deposit handling toggle and auto-inspection reminders (chips 30×24dp) mapped to `/marketplace/rental-preferences` endpoint.

## Accessibility
- Provide descriptive hints: e.g., "Enable to receive booking updates via push notifications".
- Danger actions emphasise with voiceover `isDestructiveAction`.
- Focus order ensures sticky header accessible before list items when using keyboard navigation.
- Badge status chip includes accessible label `Insurance status: Expiring in 12 days` with dynamic countdown text.

## Analytics
- Log events: `settings_toggle_changed`, `language_changed`, `theme_toggled`, `account_deleted`.
- Include `previous_value` and `new_value` in analytics payload for toggles.
- Track `settings_screen_time_ms` using `RouteAware` to gauge engagement.
- Marketplace card logs `insurance_badge_toggled`, `insurance_renewal_requested`, and `rental_preferences_updated` events to feed analytics job thresholds.

## Error Handling
- If API fails, revert toggle state and show SnackBar "Could not update. Try again.".
- For repeated failures (>3 within minute), show inline banner `Inter 13/18` with contact support link.
