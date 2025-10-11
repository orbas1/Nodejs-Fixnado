# Page Colour Specifications — Web Application v1.00

## Global Mapping
| Page Module | Primary Surface | Secondary Surface | Accent/CTA | Notes |
| --- | --- | --- | --- | --- |
| Landing Hero | `var(--fixnado-color-neutral-000)` under gradient overlay `--fixnado-gradient-hero` | KPI chip `rgba(20,69,224,0.12)` | Primary CTA `var(--fixnado-color-primary-500)`, Secondary CTA border `#FFFFFF` | Overlay ensures 4.5:1 contrast with white text |
| Geo Explorer | Map background `#E5E9F5` (Mapbox style) | Result panel `#FFFFFF` with shadow | Active filter pill `#1445E0` 16% opacity background | Drawer overlay `rgba(12,18,32,0.42)` |
| Dashboard Home | Page background `#F5F7FB` | Cards `#FFFFFF`, Quick action gradient `--fixnado-gradient-analytics` | Alert banners `#FFB020` left border 4px | Activity timeline line `rgba(20,69,224,0.16)` |
| Marketplace | Section backgrounds alternate `#FFFFFF` / `#F0F4FF` | Cards with gradient overlay `--fixnado-gradient-package-premium` 40% | Sponsored badge gradient `#FF6B3D→#FF8A5A` | CTA banner bottom `#1445E0` |
| Compliance Centre | Primary surface `#FFFFFF`, aside `#F5F7FB` | Stepper background `#E8EEFF`, active step `#1445E0` | Risk badge `#E85A5A`, Verified `#00B894` | Document list highlight `rgba(232,90,90,0.12)` for expired |
| Settings | Form background `#FFFFFF`, summary `#F5F7FB` | Tabs `#E8EEFF` active `#1445E0` text white | Save button `#1445E0`, Danger actions `#E85A5A` | Inline alerts tinted `rgba(14,165,233,0.16)` |

## Page-Specific Palettes
### 1. Landing Page
- **Hero**: Gradient `--fixnado-gradient-hero` overlay at 92%, CTA pair as above. Map thumbnails use tinted overlays `rgba(20,69,224,0.2)` to maintain brand hue.
- **How It Works**: Cards on `#FFFFFF` surface, icon backgrounds `rgba(20,69,224,0.12)`, step numbers `#1445E0`.
- **Testimonials**: Background `#111C33`, card surfaces `rgba(255,255,255,0.1)`, text white 90%, accent quotes `#1BBF92`.
- **Newsletter**: Form background `#0B1120`, input border `rgba(255,255,255,0.32)`, focus border `#0EA5E9`.

### 2. Geo-Zonal Explorer
- **Map**: Fills using tokens from `Colours.md`. Map legend background `#FFFFFF` with border `rgba(12,18,32,0.12)`, text `#0B1120`.
- **Result Panel**: Background `#FFFFFF`, header `#F5F7FB`, sticky filter bar `rgba(20,69,224,0.06)`.
- **Provider Cards**: Image overlays tinted `rgba(11,17,32,0.45)`, CTA `#1445E0`, secondary `#FFFFFF` outline `#1445E0`.
- **Drawer**: Drawer background `#FFFFFF`, dividing lines `rgba(148,163,184,0.24)`, badges referencing semantic tokens.

### 3. Consumer Dashboard
- **KPI Row**: Cards `#FFFFFF`, icon circles `rgba(20,69,224,0.12)`, metric text `#0B1120`, positive trend `#00B894`, negative `#E85A5A`.
- **Charts**: Canvas transparent, gridlines `rgba(148,163,184,0.24)`, axis labels `#4B5563`, tooltip card `#FFFFFF` with border `rgba(12,18,32,0.12)`.
- **Activity Feed**: List item background `#FFFFFF`, hover `rgba(20,69,224,0.04)`, avatars with border `#FFFFFF` (2px) to stand out.

### 4. Marketplace
- **Hero Banner**: Gradient `linear-gradient(140deg, rgba(20,69,224,0.85) 0%, rgba(0,184,148,0.76) 100%)` overlay on imagery. CTA `#FFFFFF` text `#0B1120`, secondary `#0B1120` text `#FFFFFF`.
- **Package Cards**: Background image tinted `rgba(11,17,32,0.4)`, text `#FFFFFF`, price highlight `#FFB020`, feature bullets `#FFFFFF` 80%.
- **Filters**: Pill background `rgba(20,69,224,0.12)`, selected `#1445E0`, text `#FFFFFF`, icon `#FFFFFF`.

### 5. Compliance Centre
- **Stepper**: Completed steps `#1445E0` fill, upcoming `#E8EEFF`, connecting line `#1445E0`. Step numbers white.
- **Document List**: Row alternating backgrounds `#FFFFFF` / `#F5F7FB`. Expired row background `rgba(232,90,90,0.12)`, text `#4A0F0F`.
- **Upload Panel**: Dropzone background `rgba(20,69,224,0.04)`, border `#1445E0` dashed, icon `#1445E0`.

### 6. Settings
- **Tabs**: Base `#E8EEFF`, active `#1445E0` with text white. Hover lighten to `rgba(20,69,224,0.12)`.
- **Form Inputs**: As defined in `Forms.md`. Section headers `#0B1120`, helper text `#4B5563`.
- **Security Alerts**: Danger banner `rgba(232,90,90,0.16)` background, icon `#E85A5A`, text `#4A0F0F`.

## Dark Mode Equivalents
| Page | Surface | Cards | CTA | Notes |
| --- | --- | --- | --- | --- |
| Landing | Background `#050A1A` with gradient overlay toned down to 70% | Cards `#111C33` | CTA `#3B82F6`, secondary border `#E2E8F0` | Testimonials background `#020817` |
| Explorer | Map style `fixnado-zones-dark` (Mapbox) with polygons 80% opacity | Panels `#111C33`, border `rgba(148,163,184,0.16)` | CTA `#3B82F6`, selected filter `rgba(59,130,246,0.24)` | Drawer overlay `rgba(2,8,23,0.72)` |
| Dashboard | Background `#050A1A`, cards `#0F172A` | KPI icons lighten to `rgba(59,130,246,0.18)` | Trend colours remain but lighten by +10% luminance | Charts adjust axis to `#94A3B8` |
| Marketplace | Banner overlay `linear-gradient(140deg, rgba(59,130,246,0.8), rgba(27,191,146,0.72))` | Cards `#111C33` text white | Filter pills `rgba(59,130,246,0.24)` | |
| Compliance | Surfaces `#0F172A`, stepper completed `#3B82F6` | Risk backgrounds `rgba(248,113,113,0.2)` | Upload zone `rgba(59,130,246,0.12)` | |
| Settings | Forms `#111C33`, summary `#0F172A` | Tabs active `#3B82F6`, inactive `rgba(59,130,246,0.24)` | Danger `#F87171` | |

## Accessibility Validation
- Run `pnpm test:contrast --page home` etc. tests ensuring >4.5:1 ratio.
- Provide CSS classes for `high-contrast` mode toggling to solid backgrounds: `.high-contrast .card { background: #FFFFFF; border: 2px solid #0B1120; }`.
- Monitor hero overlay brightness to ensure text accessible across locales; fallback to darker overlay if dynamic imagery fails.
- Provide print stylesheet converting backgrounds to white, text black, removing gradients while maintaining key alerts using hashed borders.

## Implementation Notes
- Colour tokens consumed via CSS variables. In React components, destructure theme: `const { colors } = useTheme();` for inline Canvas contexts (ECharts, Mapbox overlays).
- For Mapbox, style expressions reference `Colours.md` tokens; maintain JSON snippet in `public/maps/fixnado-style.json`.
- Document updates to this file in `design_change_log.md` referencing Jira tasks.
