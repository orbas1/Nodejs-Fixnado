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
| Support | link to Support Centre, documentation, contact | static + `/support/ticket` |
| Danger Zone | delete account, sign out | `/users/:id/deactivate`, `/auth/logout` |

## Interaction Rules
- Each toggle updates API immediately. Show inline spinner during call.
- Language change triggers app restart prompt with `Dialog`.
- Theme toggle immediate effect; persisted in shared preferences + backend flag.
- Delete account requires 2-step confirmation (password + typed confirmation).
- Provide undo Snackbar for non-critical preference changes (e.g., promotions opt-out) lasting 6s.
- Show success toast for saved updates (`"Settings updated"`).
- For unsupported actions offline, grey out tile and show tooltip `"Connect to the internet to change this."`.

## Layout
- Use grouped list: header label (uppercase) + `FixnadoListTile`. Danger zone card with red border, destructive button.
- Provide `View more` link for Security -> opens login history modal (list of last 10 logins).

## Accessibility
- Provide descriptive hints: e.g., "Enable to receive booking updates via push notifications".
- Danger actions emphasise with voiceover `isDestructiveAction`.
- Focus order ensures sticky header accessible before list items when using keyboard navigation.

## Analytics
- Log events: `settings_toggle_changed`, `language_changed`, `theme_toggled`, `account_deleted`.
- Include `previous_value` and `new_value` in analytics payload for toggles.
- Track `settings_screen_time_ms` using `RouteAware` to gauge engagement.

## Error Handling
- If API fails, revert toggle state and show SnackBar "Could not update. Try again.".
- For repeated failures (>3 within minute), show inline banner `Inter 13/18` with contact support link.
