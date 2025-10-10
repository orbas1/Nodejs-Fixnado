# Button Styles & Behaviour

| Variant | Default | Hover/Focus | Disabled | Usage |
| --- | --- | --- | --- | --- |
| Primary | Background `color-accent`, text white, shadow level-1 | Brighten by 6%, add 2px outline `color-accent-200` | 40% opacity, remove shadow | Core CTAs: Book, Launch Campaign, Save |
| Secondary | Transparent background, 1px border `color-accent`, text `color-accent` | Fill with 8% accent tint | 40% opacity border | Secondary actions: View details, Preview, Manage |
| Tertiary | Text link style with underline on focus | Underline and lighten text | 40% opacity text | Inline actions, help links |
| Destructive | Background `color-danger`, text white | Darken by 8%, maintain focus outline | 40% opacity | Cancel job, Remove asset, Delete consent |
| Ghost Dark | Transparent with white border/text | Slight white tint background | 30% opacity | Hero on dark imagery |

## Interaction Rules
- Minimum touch area 48x48px; maintain 16px spacing between stacked buttons.
- Icon-only buttons include tooltip labels and accessible `aria-label` text.
- Loading state shows inline spinner left of label; disable pointer events.
- Confirm destructive actions with secondary modal containing explicit consequences and checkbox for irreversible steps.
