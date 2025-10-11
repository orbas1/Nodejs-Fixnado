# Button System Specifications — Phone Application v1.00

## Variants
| Variant | Use Case | Dimensions | Style |
| --- | --- | --- | --- |
| Primary | Main action on screen | 320×56dp | Gradient fill `#1C62F0 → #4C8DF8`, text `Manrope 16/24` bold white |
| Secondary | Supporting action equal importance | 320×52dp | Solid fill `#0066F5`, text white, elevation 4dp |
| Tertiary (Ghost) | Low emphasis navigation | 320×48dp | Transparent fill, border 1dp `rgba(0,102,245,0.32)`, text `#0066F5` |
| Destructive | Irreversible actions | 320×52dp | Fill `#E74C3C`, pressed `#C0392B`, text white |
| Icon Only | Map, chat actions | 48×48dp | Circular, background `rgba(12,34,66,0.08)` |
| FAB | Contextual quick action | 64×64dp | Circular, gradient fill, drop shadow level 3 |
| Segmented Control Button | Toggle states | 104×44dp (avg) | Active gradient, inactive `#EEF3FF` |

## States
- **Default**: 100% opacity, specified elevation.
- **Hover (desktop web preview)**: lighten gradient by 8%, drop shadow level +1.
- **Pressed**: Scale 0.98, apply primary-600 tone, reduce elevation by 2.
- **Disabled**: Background `rgba(17,24,39,0.16)`, text `rgba(17,24,39,0.48)`, remove gradient.
- **Focus**: 2dp outline `#0EA5E9`, outer glow `rgba(14,165,233,0.24)`.

## Icon Placement
- Icon + label buttons: icon 20dp left-aligned with 12dp spacing from text. Ensure semantics `button` role includes icon description.

## Loading State
- Replace text with `CircularProgressIndicator` 20dp, maintain button width. Text hidden but accessible label updated to "Loading".

## Animation Specs
- Entrance: `FadeIn + SlideUp` 24dp over 220ms when bottom sheet reveals.
- Exit: `FadeOut` 120ms.

## Implementation
- Flutter `FixnadoButton` extends `StatelessWidget` with enum `FixnadoButtonStyle { primary, secondary, ghost, destructive, icon, fab }`.
- Provide `isExpanded` parameter for full-width vs. inline (min width 140dp).
- Use `Theme.of(context).extension<FixnadoButtonTheme>()` for tokens enabling theming updates.

## Layout & Spacing Rules
- Button text centered with letter spacing 0.2%; text baseline vertically aligned to maintain consistent feel across heights.
- Icon + label variant: maintain 16dp padding left/right; icon sits within 20dp square, separated by 12dp gap.
- Stacked button groups maintain 12dp vertical spacing; horizontal pairs use 12dp gutter.
- Danger zone buttons use 24dp top margin relative to preceding content for emphasis.

## Dark Mode Adjustments
- Primary gradient shifts to `#2563EB → #3B82F6`, text remains white.
- Ghost button border uses `rgba(59,130,246,0.48)`; text `#93C5FD`.
- Destructive button retains `#F87171` base; pressed `#DC2626`.
- Focus outline transitions to `rgba(147,197,253,0.64)` for readability on dark surfaces.

## Haptics & Sound
- Default tap: `HapticFeedback.mediumImpact` + optional subtle click sound (configurable) using `SystemSoundType.click`.
- Destructive actions escalate to `HapticFeedback.heavyImpact` to reinforce caution.
- Long press on FAB triggers `HapticFeedback.selectionClick` while radial menu expands.

## QA Checklist
- Verify hit target coverage using Flutter Inspector (should show 48×48dp area).
- Confirm disabled state contrast ratio ≥3:1 with underlying background.
- Ensure semantics label includes action + context (e.g., "Book now with provider Fixnado Cooling").

## Accessibility
- Minimum hit target 48dp.
- Provide `semanticLabel` property for icon-only variants.
- Ensure high contrast ratio >7:1 for text vs. background.
