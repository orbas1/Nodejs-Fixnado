# Text & Copy Guidelines — Web Application v1.00

## Voice & Tone
- **Voice**: Confident, expert, and supportive. Communicate complex geo-zonal logistics in clear, concise sentences.
- **Tone**: Adjust per context — friendly for onboarding, direct for compliance, data-driven for analytics.
- Avoid jargon unless defined (e.g., "Zone Yield" explained via tooltip on first occurrence).

## Content Structure
- Use headline-subhead-body hierarchy. Example: `heading-lg` for section, `body-md` paragraphs limited to 80 characters per line.
- Bullet lists limited to 5 items; use numbered steps for procedural instructions (booking, onboarding).
- Provide contextual helper text below inputs (14/20) describing formatting ("Enter a 10-digit number").

## Microcopy Library
| Scenario | Copy | Placement |
| --- | --- | --- |
| Hero CTA | "Unlock instant geo-zonal coverage with trusted providers." | Landing hero overlay |
| Empty State (Bookings) | "No bookings scheduled yet. Explore zones to secure your first service." | Booking table empty card |
| Error Toast | "We couldn’t load zone metrics. Try again or check status.fixnado.com." | Global toast |
| Success Toast | "Booking confirmed. We’ve sent a timeline to your inbox." | Booking confirmation |
| Compliance Reminder | "Upload updated insurance documents to keep your zone coverage active." | Dashboard checklist |

## Accessibility & Internationalisation
- Provide translation keys in `i18n/web.json` matching slugified copy (`hero.unlock_geo_zones`).
- Avoid directional references; use neutral wording ("Select from the options above" instead of "left/right").
- Support dynamic date/time formats via `formatDate()` helper with locale.
- Use plain language for error messages; include recovery steps.

## Text Styling Rules
- Maximum paragraph width 720px for readability.
- Use `body-md` for standard paragraphs, `body-sm` for captions, `overline` for metadata.
- Apply `font-feature-settings: 'liga' off` on hero headings to maintain clarity at large sizes.
- For emphasised text, use `font-weight: 600` instead of italics to preserve clarity.

## Content Review Process
1. Copy drafted in Figma with design context.
2. Reviewed by product marketing for brand alignment.
3. Localisation team updates translations and context notes.
4. Engineering sync ensures string keys exist before release.

## SEO & Metadata
- Title tags follow format: `Primary Keyword | Fixnado Geo Marketplace`.
- Meta descriptions 155 characters max; highlight differentiators (coverage speed, compliance guarantees).
- Use structured data (JSON-LD) for provider listings (schema.org `Service` and `LocalBusiness`).

## Dynamic Text Sources
- Pull provider bios from `CMS/providers` with sanitisation (allow `<strong>`, `<em>`, `<ul>` only).
- Real-time stats (availability, response time) fetched from analytics API; format numbers with `Intl.NumberFormat`.
- Chat transcripts stored in secure storage; show last message preview truncated to 80 chars with ellipsis.
