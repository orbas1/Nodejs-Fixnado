# Widget Functional Specifications — Phone Application v1.00

## Buttons
- **Primary Button**: Fires primary action. Disabled state reduces opacity to 32%, removes elevation. Press generates medium haptic feedback, analytics event `ui_button_primary_tap` with `screen` and `action` params.
- **Secondary Button**: Used for supportive actions; analytics event `ui_button_secondary_tap`.
- **Ghost Button**: Always accompanied by primary within dialogs/sheets. Focus state adds 2dp outline `#1C62F0` for accessibility.
- **Icon Button**: `InkResponse` ripple; long-press shows tooltip when available.
- **FAB**: Contextual actions per tab. On Explore, opens quick booking sheet; on Bookings, opens support request. Elevation 18dp, rotates 45° when expanded.

## Cards
- **Provider Card**: Entire card clickable; CTA buttons inside have priority. Card tap -> provider detail; long press -> quick save toggle. Bookmark icon top-right toggles `savedProviders` state.
- **Metric Card**: Tap opens corresponding analytic detail screen. On long press, shows tooltip with timeframe (e.g., "Last 7 days").
- **Alert Card**: Swipe left reveals snooze actions; swipe right resolves alert and triggers API call.

## Forms
- **Text Fields**: Use floating labels. Validation runs on submit and on focus loss. Error message displayed under field with icon 16dp red. Keyboard type set per context. Password field includes visibility toggle (icon button 24dp).
- **Dropdowns**: Expand bottom sheet menu if >6 items; else inline menu anchored to field.
- **Toggles**: Update state instantly; show SnackBar confirm for critical preferences (e.g., disabling notifications).
- **Checkbox**: Support tristate for compliance items (unchecked, pending, verified) indicated by dash icon.
- **Calendar Picker**: Inline month view with ability to long-press to select multi-day bookings.

## Navigation Elements
- **Bottom Navigation**: Maintains separate navigator stacks. Double-tap on active tab scrolls to top of root list (if scrollable). Badges update via `StreamProvider` of unread counts.
- **Drawer**: Drag gesture threshold 32dp. Items with nested options open expansion list.
- **Segmented Control**: Animated switch uses `AnimatedAlign`. Selection change triggers `onSegmentChanged` callback with analytics event.

## Messaging Widgets
- **Chat Bubble**: Support long-press context menu with copy, forward, delete. Reaction bar slides from top with emoji options.
- **Typing Indicator**: Animates using `ScaleTransition`. Deactivates after 10s of inactivity.
- **Attachment Tile**: Shows upload progress ring 20dp overlay; failure state offers retry button.

## Map Overlays
- **Filter Chips**: Tapping toggles filter state; chips animate to active with background fill change and icon swap.
- **Zone Legend**: Expand/collapse icon toggles height from 88dp to 160dp with `AnimatedSize`. Contains checkboxes to hide zone layers.
- **Provider Pin**: Custom marker 36dp, includes drop shadow. Tapping opens mini card above map with name, rating, CTA.

## Feedback & Alerts
- **SnackBar**: Auto dismiss 4s; actions extend to 8s. For errors, background switches to `#E74C3C` with white text.
- **Toast**: Non-interactive, 2.5s display. Used for saved providers, copied info.
- **Modal Dialog**: Blocks background; confirm button primary, cancel ghost.

## Progress Indicators
- **Linear Progress**: Height 6dp, used in upload bars. Uses gradient fill.
- **Circular Progress**: 48dp, stroke 4dp. For inline loading, dims parent content to 40% opacity.

## Accessibility & Internationalisation
- Every widget exposes `Semantics` labels referencing copy deck.
- Support Right-to-Left: widgets mirror layout; icons maintain orientation except directional (arrow) icons swapped.
- Dynamic type up to 1.3x: components enlarge while maintaining 8dp spacing increments.

## Analytics & Instrumentation
- Buttons emit `ui_button_*` events with `screen`, `cta_id`, and `experiment_variant` parameters. Ghost buttons also log `secondary_action_used` for funnel diagnostics.
- Cards log `card_tapped` with `card_type`, `context`, `position_index` to analyse discoverability.
- Map overlays emit `layer_toggled` (payload: `layer_id`, `is_visible`), `chip_filter` (payload: `filter_id`, `state`).
- SnackBars include `toast_shown` event with `severity` and `duration_ms` for support case correlation.

## Error Handling Patterns
- Provider cards show inline banner if API returns error status; CTA buttons disabled and tooltip explains reason.
- Form widgets surface global error summary at top when submission fails; "Scroll to error" button focuses first invalid field.
- Upload widget handles `413 Payload Too Large` by swapping drop zone instructions with limit copy and highlight border red.

## Offline Behaviour
- Buttons check connectivity provider; if offline and action not allowed, show toast "Offline mode" with `Retry` option when connection restored.
- Lists display cached data with timestamp chip `Inter 12/16` grey; manual refresh attempts queue until connection regained.
- Chat input stores unsent messages in local queue; badge indicates "Queued" status.
