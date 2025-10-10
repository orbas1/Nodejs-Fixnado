# Profile Page Visual Design — Web Application v1.00

## Layout Overview
- Header section height 320px with cover image (optional) tinted `rgba(11,17,32,0.65)`.
- Profile avatar 160px circle centered on overlap between header and content with 6px white border and drop shadow level 2.
- Name `Manrope 32/40`, role `Inter 18/28`, zone badges inline chips 32px height.
- Action buttons (Message, Book, Share) aligned right, 56px height.

## Content Sections
1. **Overview**
   - Two-column layout (bio left 8 columns, contact card right 4 columns).
   - Bio text `body-md`, 640px width limit.
   - Contact card includes CTA button 100% width, contact list icons 20px.
2. **Services & Packages**
   - Tabbed interface (Services, Packages, Certifications, Reviews).
   - Services displayed as accordion (title `heading-sm`, body `body-sm`).
   - Packages as cards 320×220 with price highlight badge `#1445E0`.
3. **Performance Metrics**
   - KPI row (Completion rate, SLA, Response time) with radial progress 120px.
   - Customer satisfaction chart (bar) width 720px, height 280px.
4. **Reviews**
   - List items 100% width, 120px height, includes rating stars (20px) and comment snippet.

## Visual Treatments
- Use subtle background gradient `linear-gradient(180deg, #FFFFFF 0%, #F5F7FB 100%)` on content area.
- Section headers have decorative underline gradient `linear-gradient(90deg, #1445E0 0%, rgba(20,69,224,0) 100%)` height 4px.
- Tabs highlight with 4px indicator and background `rgba(20,69,224,0.08)`.

## Imagery & Media
- Cover image optional 1440×360. Default uses pattern `profile-bg-pattern.svg` from `assets/patterns/`.
- Service icons (24px) from `@fixnado/icons` set (line style 1.75px).
- Certifications use badge icons 32px with label overlay.

## Responsiveness
- Tablet: Avatar 120px, action buttons convert to icon+text stacked below header.
- Mobile: Header height 240px, avatar 96px. Tabs convert to horizontal scroll with 48px height.
- Sections stack single column; contact card moves below overview text.

## Accessibility
- Provide alt text for avatar and cover (if not decorative).
- Ensure contrast ratio 4.5:1 for text on tinted cover image.
- Reviews list accessible with keyboard; show `aria-label` summarising rating ("5 stars from Amanda").

## Data Integration
- Profile data from `/providers/:id` or `/users/:id` depending on persona.
- Reviews paginated (page size 5). Provide "Load more" button with spinner.
- Metrics aggregated via analytics service; update every 15 minutes.
