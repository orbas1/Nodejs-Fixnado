# Component Types Catalogue — Web Application v1.00

## Button Variants
| Variant | Dimensions | Style Tokens | Behaviour | Asset Dependencies |
| --- | --- | --- | --- | --- |
| Primary | Height 56px (desktop) / 52px (tablet) / 48px (mobile); radius 12px | `background: var(--fixnado-color-primary-500)`; hover `var(--fixnado-color-primary-600)`; focus ring `3px var(--fixnado-color-info-500)` | Ripple disabled; uses transform -1px on hover; loading spinner 20px | `@fixnado/icons` `spinner-20.svg` |
| Secondary | Same heights as primary; border 1px `var(--fixnado-color-primary-500)` | Transparent background; hover `rgba(20,69,224,0.08)`; active `rgba(20,69,224,0.16)` | Used for secondary CTAs; toggles support `data-state` attributes | n/a |
| Ghost | Height 44px; padding `0 16px` | Text `var(--fixnado-color-primary-500)`; hover underline; focus ring `2px` | For inline actions (e.g., card footers) | n/a |
| Destructive | Height 48px; radius 12px | `background: var(--fixnado-color-danger-500)`; hover `#C94C4C` | Confirmation modals; includes icon `warning-24` | `packages/icons/warning-24.svg` |
| Icon | 44×44px circle (desktop) / 40×40px (mobile) | Background `rgba(12,18,32,0.08)`; hover `rgba(12,18,32,0.16)` | Contains 24px icon; tooltip on hover/focus | `@fixnado/icons` |
| Floating Action | 64×64px circle; drop shadow `var(--fixnado-shadow-3)` | Gradient `--fixnado-gradient-analytics`; icon 28px centre | Appears mobile bottom-right for quick actions | n/a |

## Navigation Elements
| Component | Specs | States | Notes |
| --- | --- | --- | --- |
| Sidebar Item | Height 52px, icon 24px, label `Inter 16/24`, left padding 20px | `default`, `hover`, `active`, `disabled` | Active indicator 3px border, `aria-current="page"` |
| Sidebar Group Header | Height 40px, uppercase `Manrope 12/16`, letter spacing 0.08em | `expanded`, `collapsed` | Chevron 16px rotates 90° |
| Top Nav Button | Height 44px, icon 20px, optional badge 16px | `default`, `hover`, `focus`, `notification` | Notification badge `#E85A5A`, size 18px |
| Bottom Nav Item | Height 56px, icon 24px, label 12px | `default`, `active` | Active uses `color: var(--fixnado-color-primary-500)`, indicator dot 4px |
| Breadcrumb Link | Font `Inter 14/20`, separators 8px | `default`, `hover`, `collapsed` | Collapsed items grouped into dropdown |

## Card Types
| Card | Dimensions | Structure | Content |
| --- | --- | --- | --- |
| KPI Card | 280×160px, padding 24px | Icon circle top-left, metric centre, trend badge bottom-right | Value `IBM Plex Mono 28/32`, label `Inter 14/22`, trend `+4.6%` |
| Provider Card | 360×200px | Image 132×132 left, info stack right, CTA bar bottom 48px | Name `Manrope 20/28`, badges row 20px height, CTAs `Book now`, `Contact` |
| Package Card | 280×360px | Image top, overlay gradient, text area 160px, CTA 48px | Title `Manrope 18/26`, price `Inter 18/26`, features bullet list |
| Task Card | 320×140px | Header (status pill + due date), description, footer avatars | Supports drag handle icon 16px |
| Alert Card | 100% width x 120px | Left border 4px severity colour, icon 32px, text, action button 120×44px | For system alerts |
| Table Row Card (mobile) | 100% width, padding 20px, radius 16px | Label-value stacks with 12px gap | Replaces table row at `sm` breakpoint |

## Form Elements
| Element | Size | Styling | Interaction |
| --- | --- | --- | --- |
| Text Input | Height 48px, radius 12px, padding 12px 16px | Border 1px `#CBD5F5`; focus `2px #1445E0`, shadow `rgba(20,69,224,0.12)` | On error show icon `error-16.svg` and helper text red |
| Textarea | Min height 128px | Border same as input; resize vertical only | Character counter bottom-right 12px |
| Select / Combobox | Trigger height 48px; list width min 320px | Items 44px height; highlight `rgba(20,69,224,0.12)` | Supports async search with loading spinner |
| Checkbox | Box 20×20px; label `Inter 14/20` | Checked background `#1445E0`, icon `check-14.svg` | Focus ring `3px #0EA5E9` |
| Radio | Outer 20px circle; inner 10px dot | Selected fill `#1445E0` | Group arranged horizontally (24px gap) or vertical |
| Switch | Track 44×24px, thumb 18px | Active track `rgba(20,69,224,0.32)`, thumb `#1445E0` | `aria-checked` toggled via keyboard |
| Slider | Track 8px height; handle 20px | Active track `#1445E0`, rest `#CBD5F5` | Tooltip bubble 32×24px displays value |

## Modal & Overlay Types
| Type | Dimensions | Usage |
| --- | --- | --- |
| Standard Modal | Width 480px (content) + padding 32px; radius 16px | Confirmation, forms |
| Wide Modal | Width 720–960px, height `min(85vh, 680px)` | Booking detail, analytics snapshot |
| Fullscreen Modal | 100vw × 100vh; safe-area padding 16px | Mobile map, step-by-step flows |
| Side Drawer | 420px width desktop; 360px tablet; 100% mobile | Filter panels, detail sidebars |
| Bottom Sheet | Height `min-content`, max 80vh; radius 24px top corners | Mobile filters, quick actions |

## Data Visualisation Widgets
| Widget | Size | Tokens |
| --- | --- | --- |
| Heatmap Legend | 280×88px | Gradient `--fixnado-gradient-map-surge`, tick labels `Inter 12/16` |
| Trend Line Chart | 100% width × 320px | Palette `[ #1445E0, #1BBF92, #FFB020 ]`, gridlines `rgba(148,163,184,0.24)` |
| Stacked Bar | 100% width × 280px | Bars radius 8px, gap 12px, axis label `Inter 12/16` |
| Gauge | 280×220px | Dial background `#E8EEFF`, needle `#1445E0`, success band `#00B894` |
| Progress Ring | 160×160px | Stroke width 14px, gradient `--fixnado-gradient-analytics` |

## Messaging Components
| Component | Dimensions | Notes |
| --- | --- | --- |
| Toast | 360×56px desktop; 100% width - 32px mobile | Icon 20px left, close button 16px |
| Snackbar | 420×72px | Border-left severity colour 4px |
| Notification Drawer | Width 360px; list item height 72px | Timestamp `Inter 12/16` grey |
| Chat Bubble Agent | Max width 420px; radius 16px | Background `rgba(20,69,224,0.12)` |
| Chat Bubble User | Max width 420px; radius 16px | Background `rgba(14,165,233,0.2)` |

## Accessibility & Theming
- All components support dark mode via `[data-theme="dark"]` overrides (surface tokens from `Colours.md`).
- Provide `data-density` attribute for compact layouts (cards padding 16px, tables 56px row height).
- Focus outlines use 3px `#0EA5E9` with `outline-offset: 3px`; maintain visible focus even on gradient backgrounds.
- Support high contrast mode toggles increasing border weight to 2px and removing gradient backgrounds.

## Implementation References
- `@fixnado/ui` houses React components matching specs; Storybook path `Components/*` documents states.
- Legacy SCSS modules use mixins defined in `Scss.md` for consistent radius, shadow, gradient application.
- Figma components located under `Fixnado Web > Library > Components` with matching naming (e.g., `Button/Primary/Large`).
- Engineers must annotate PRs with `@spec` comments referencing this file (e.g., `@spec Screens__Update_widget_types.md §Button Variants`).
