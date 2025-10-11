# Layout Organisation & Positioning — Phone Application v1.00

## Grid System
- Base grid: 8dp increments. Screen margins 16dp on phones, 24dp on tablets (>600dp width).
- Content width: `screenWidth - (2 * margin)` (e.g., 360dp viewport → 328dp content width).
- Cards & forms align to grid columns; use `Spacer` components rather than manual padding.

## Vertical Rhythm
- Section headers separated by 24dp from preceding content.
- Between card lists: 16dp vertical spacing.
- Within cards: top/bottom padding 16dp, between text lines 8dp.

## Alignment Rules
- Buttons and CTA bars align center horizontally.
- Icons align vertically with text baseline when inline; use `CenterLeft` alignment for list tiles.
- Map overlays align to safe area edges: left offset 16dp, bottom offset 24dp.

## Component Placement
- **Explore Screen**: App bar pinned top, map occupies top 340dp, bottom sheet anchored with 24dp radius corners. Filter chips overlay top of map with 12dp margin.
- **Booking Steps**: Stepper header fixed top; content scrolls under with `SliverFillRemaining`. CTA bar sticky bottom.
- **Messaging**: App bar pinned, message list uses `ReverseListView` with `padding: EdgeInsets.symmetric(horizontal:16, vertical:12)`. Input bar anchored bottom with safe area inset 24dp.
- **Settings**: Use grouped `ListView` with section header (uppercased) pinned when scrolling using `SliverPersistentHeader` height 40dp.

## Safe Area Considerations
- All bottom sheets include 16dp extra padding for gesture navigation bars (Android) and 34dp for iOS home indicator.
- For iPhone with notch, top safe area 44dp ensures app bar content not clipped.

## Responsive Behaviours
- **Landscape orientation**: Use split view for Explore (map left 60%, list right 40%), Booking (summary right 35%).
- **Large screens**: Increase margin to 24dp, card width 360dp max.
- **Compact width**: Reduce horizontal padding to 12dp, convert button groups to stacked vertical.

## Motion Placement
- Floating elements (FAB, map controls) maintain 16dp offset from edges. When bottom sheet expanded >70%, FAB translates up by sheet height + 16dp.

## Z-Index Hierarchy
1. System overlays (dialogs, toasts)
2. Bottom sheets / modals
3. FAB & floating controls
4. Content cards
5. Background surfaces (map, gradient hero)

## Accessibility & Focus Order
- Focus traversal flows top-to-bottom, left-to-right. For bottom sheet, `FocusTraversalGroup` ensures contained focus.
- Ensure dynamic additions (SnackBar, toast) announced but do not trap focus.
- Provide logical focus order for dual-pane layouts (landscape) using `FocusTraversalPolicy` to move left pane top→bottom then right pane.

## Screen-Specific Layout Notes
- **Booking Detail**: Summary header 360×160dp with sticky action bar 320×56dp at bottom. Section toggles 24dp high chips anchored top of each section.
- **Notifications Center**: Use `SliverAppBar` pinned height 120dp containing segmented filter (All, Unread, Alerts) 320×40dp. List items 88dp with timestamp right-aligned.
- **Marketplace Grid**: Two-column layout with 12dp gutter; cards 160dp width, 16dp padding. CTA pill anchored bottom-right overlay 12dp margin.
- **Saved Providers List**: Use `SliverList` with card 328×140dp, trailing icon button to unsave positioned at 16dp from top right inside card.
- **Document Vault**: Masonry layout enabling 2 columns with 16dp gutter; ensures consistent baseline by aligning file title baseline across columns.
- **Support Centre**: Accordion sections (FAQs) with header 64dp, content area 328×auto with 20dp padding; icons 24dp left.
