# Component Types — Web Application v1.00

## Layout Primitives
| Component | Dimensions | Breakpoint Behaviour | Notes |
| --- | --- | --- | --- |
| `AppShell` | 100% viewport width/height | Sidebar collapses <1280px, header shrinks to 64px <1024px | Hosts header, navigation, content region; uses CSS grid `grid-template-columns: auto 1fr` |
| `GridSection` | 12-column, 80px columns, 24px gutters | Tablet switches to 8-column (72px columns, 20px gutters); mobile 4-column (min 72px) | Wraps sections like dashboards, cards, tables |
| `Stack` | Width determined by parent | Applies `gap` tokens `8/12/16/24/32px` | Vertical stacking for forms, card lists |
| `SplitPanel` | 60/40 or 70/30 width ratio | Collapses to stacked at <1024px | Used for map/list, detail/summary |

## Content Containers
| Component | Default Size | Interaction | Purpose |
| --- | --- | --- | --- |
| `HeroBanner` | 1440×480px | Carousel auto-advances every 6s; manual arrows | Landing promotions, zone highlights |
| `MetricTile` | 280×160px | Hover elevate 4px, click opens analytics drawer | Display KPI metrics |
| `DataCard` | 360×180px | Contains image slot 120×120px, CTA row | Provider, marketplace listing |
| `TableWrapper` | Full width, min height 560px | Sticky header, resizable columns | Booking, compliance data |
| `FormSection` | Max width 720px | Collapsible subsections, autosave indicator | Complex settings forms |

## Navigation Components
| Component | Size | State Variants | Description |
| --- | --- | --- | --- |
| `SidebarNav` | 264px wide | Expanded, collapsed, drawer | Houses primary nav; icons 24px; text `Inter 16/24` |
| `TopNav` | Height 72px | Default, scrolled (64px), overlay (transparent) | Includes breadcrumbs, search, utilities |
| `BottomNav` | Height 72px | Default, active highlight, hidden (on scroll) | Mobile nav with 4 icon buttons |
| `Breadcrumb` | Auto width | Overflow collapse to menu at >5 items | Display hierarchical location |

## Feedback & Status Components
| Component | Size | Styling | Usage |
| --- | --- | --- | --- |
| `Toast` | 360×56px | Background `#111827`, border radius 12px, shadow level 2 | Inline success/error/info messaging |
| `Snackbar` | 400×72px | Border-left accent token, icon 24px | Multi-line alerts |
| `ProgressStepper` | Horizontal width 100%, height 80px | Steps 48px circles, connecting line 4px | Booking wizard, compliance checklist |
| `LoadingSkeleton` | Custom | Shimmer gradient `linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.4), rgba(255,255,255,0))` 1.2s | Placeholder for async data |

## Data Visualisation
| Component | Size | Notes |
| --- | --- | --- |
| `ZoneHeatmap` | Full width, height 480px | Mapbox GL canvas; overlays polygon, gradient scale bottom-left |
| `TrendChart` | Width 100%, height 320px | ECharts line chart, gradient fill 24% opacity |
| `BarComparison` | Width 100%, height 280px | Stacked bars with rounded corners 8px |
| `GaugeCard` | 280×220px | Circular gauge 180° sweep, center metric |

## Interactive Utilities
- **`CommandPalette`**: 640px width desktop, 100% mobile. Search results grouped with pill filters.
- **`FilterDrawer`**: Right drawer 420px. Contains segmented controls, sliders (min width 220px), tag chips.
- **`AvatarGroup`**: Overlapping avatars 32px, offset -8px. Exceeding count displays `+X` pill.
- **`UploadZone`**: 100% width, 220px height, dashed border 2px `#1445E0`, drop icon 64px.

## Widget Source Mapping
- Icons sourced from internal `@fixnado/icons` library (`/frontend-reactjs/packages/icons`).
- Map tiles served via Mapbox style `fixnado-zones-web-v7` with fallback PNG at `/frontend-reactjs/public/assets/maps/`.
- Illustrations from `design/illustrations/web/v1.00` repo commit `a4f7d1c` (vector SVG export at 1440px).
- Charts rely on `apache/echarts` NPM package with custom theme defined in `Scss.md`.
