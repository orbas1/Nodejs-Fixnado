# Settings Page Specification — Web Application v1.00

## Layout
- Page title `Settings` (heading-xl) with subtitle `Configure your Fixnado workspace`.
- Tabs row height 56px, pill indicator 4px thickness.
- Content area uses two-column grid (form left 8 columns, summary right 4 columns). Mobile collapses to single column with summary below forms.
- Sticky save bar appears when changes detected, height 64px bottom of viewport.

## Section Details
### Profile
- Fields: Name, Email, Phone, Company, Time Zone (select), Avatar upload.
- Avatar component 120px circle with overlay edit icon 32px.
- Save button primary, Reset ghost.

### Notifications
- Toggle groups (Booking updates, Promotions, Compliance alerts, System announcements). Each row includes description text 60% width, toggle right.
- Digest frequency dropdown (Immediate, Daily, Weekly).

### Security
- Change Password accordion with inputs (current, new, confirm).
- MFA card with status badge (Enabled/Disabled) and action button `Enable` or `Disable`.
- Login history table (5 entries) with device, location, last seen, action `Sign out`.

### Billing
- Payment method card showing last 4 digits, expiry, brand icon 32px. Buttons `Update`, `Remove`.
- Invoice table with download action.

### Integrations
- App tiles 240×160px, show status (Connected/Not connected). CTA `Connect`.

### Danger Zone
- Card background `#FEF2F2`, border `#FCA5A5`. Buttons `Export data` (secondary) and `Deactivate account` (destructive).

## Interaction
- Form auto-saves toggles, manual save for text fields.
- Confirmation modals for destructive actions with typed confirmation (`DELETE`).
- Success toast `Settings updated` appears top-right for 4s.

## Accessibility
- Tabs accessible via arrow keys; use `aria-controls` linking to panel IDs.
- Provide `aria-describedby` for toggles referencing description text.
- Danger buttons flagged with `aria-describedby` warning text.
