# Forms Catalogue & Patterns

## Multi-step Wizards
- **Booking Checkout:** Steps – Details → Schedule → Add-ons → Payment → Review. Progress indicator with ability to save draft and invite collaborators. Validate availability in real-time; show compliance banners before payment.
- **Campaign Builder:** Steps – Goal → Audience → Budget → Creative → Review. Provide KPI forecast sidebar, regulatory checklist, and asset upload guidelines.
- **Dispute Resolution:** Steps – Issue type → Evidence upload → Resolution proposal → Confirmation. Include SLA countdown and mediation contact.

## Inline & Modal Forms
- **Quick Invite Modal:** Collect name, email, role, zone access. Display policy acknowledgement toggle and send preview email link.
- **Inventory Adjustment Drawer:** Input quantity, reason, effective date; show utilisation chart for context.
- **Consent Request Panel:** Offer templates, expiry date, data scope; require digital signature.

## Validation & Feedback
- Use inline validation with icons and descriptive text; summarise errors at top on submit.
- Provide helper text for complex fields (e.g., "Budget must be between £50-£5,000; instalments available").
- Auto-format phone numbers, currency, and percentage fields; support manual override.
- On success, show contextual toast and highlight impacted modules (e.g., new campaign appears in dashboard).

## Accessibility
- Label every field; associate descriptive hint via `aria-describedby`.
- For multi-select chips, provide keyboard shortcuts and `Select all` options.
- Ensure colour is not the only validation indicator; include icons and text.
