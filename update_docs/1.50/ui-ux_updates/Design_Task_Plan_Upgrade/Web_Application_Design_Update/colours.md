# Colour Tokens (Web)

| Token | Light Mode | Dark Mode | Usage |
| --- | --- | --- | --- |
| `color-primary` | #0B1F33 | #EEF5FF | Primary nav, hero typography |
| `color-accent` | #1ABC9C | #1ABC9C | Primary buttons, active states |
| `color-highlight` | #FFB347 | #FFB347 | Promotion banners, KPI spikes |
| `color-danger` | #E84393 | #FF6FA5 | Errors, destructive actions, overdue compliance |
| `color-warning` | #F39C12 | #FFB95E | Pending actions, expiring documents |
| `color-success` | #2ECC71 | #4ED89A | Success toasts, completed tasks |
| `color-info` | #3498DB | #5DADE2 | Informational alerts, tooltips |
| `color-surface` | #FFFFFF | #101826 | Cards, panels, drawers |
| `color-muted` | #F5F6FA | #1B2635 | Section backgrounds, filter bars |
| `color-border` | #E5E9F0 | #2D3747 | Dividers, table lines |
| `color-text` | #1F2933 | #F2F4F7 | Primary text |
| `color-text-muted` | #4B5563 | #D0D5DD | Secondary text |
| `color-chart-1/2/3` | #4C78A8 / #F58518 / #54A24B | same | Chart palettes for analytics |

## Gradients & Overlays
- **Hero Gradient:** `linear-gradient(135deg, rgba(11,31,51,0.92), rgba(26,188,156,0.65))` layered over imagery for hero banners.
- **AI Insight Banner:** `linear-gradient(90deg, rgba(84,162,75,0.15), rgba(26,188,156,0.05))` for subtle highlight.
- Provide theme-aware gradient tokens stored in SCSS maps for reuse.

## Accessibility Notes
- Ensure button text contrast ratio > 4.5:1; adjust accent lighten/darken tokens as required.
- Focus outlines use `color-accent` with 2px width; fallback to `#FFFFFF` for dark surfaces to maintain contrast.
