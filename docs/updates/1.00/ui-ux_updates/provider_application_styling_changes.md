# Provider App – Styling Changes

## Visual Language
- Adopt industrial palette (deep charcoal, safety orange, slate blue, neutral greys) to reflect operations and logistics. Provide light/dark modes with contrast ratios ≥ 4.5:1. Accent colours reserved for statuses (Escrow, Overdue, Completed) and timeline hub urgency levels.【F:docs/updates/1.00/features_to_add.md†L10-L25】【F:docs/updates/1.00/new_feature_brief.md†L56-L126】
- Typography uses headline-serif pairing for brand headlines and geometric sans for body text to improve legibility in dashboards and cards. Font sizes scale responsively across breakpoints with consistent line height.【F:docs/updates/1.00/features_update_plan.md†L66-L82】

## Component Styling
- Dashboard cards employ elevation, rounded corners (8px), and inset shadows to separate metrics; statuses displayed via pill badges. Skeleton loaders animate during API fetches to communicate live data focus.【F:docs/updates/1.00/update_task_list.md†L175-L183】
- Forms and wizards utilise segmented steps with progress tracker, validation messages, and inline upload checker statuses. Buttons follow tiered hierarchy (Primary = orange, Secondary = slate outline, Destructive = crimson).【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L13-L21】

## Timeline Hub
- Timeline hub posts adopt card layout with avatar, role badge, zone label, ad/recommendation flag, urgency badge, and action bar (follow, report, share). Media galleries use carousel thumbnails with tap-to-expand overlays. Custom Job and Marketplace feeds use accent frames to highlight high-priority jobs or inventory shortages.【F:docs/updates/1.00/update_task_list.md†L155-L163】【F:docs/updates/1.00/update_task_list.md†L208-L216】

## Charts & Analytics
- Finance charts employ dual-tone bars/lines with tooltips showing currency, tax, escrow state. Analytics include trend arrows and spark lines for quick scanning. Consistent legend placement ensures readability on mobile width.【F:docs/updates/1.00/new_feature_brief.md†L56-L126】【F:docs/updates/1.00/update_task_list.md†L112-L120】

## Support & Policies
- Chatwoot integration styled with brand colours, bubble shadows, and accessible chat input field featuring emoji/GIF pickers; unread badges use bold outline and subtle glow. Policy screens implement two-column layout (TOC + content) when tablet/desktop width available, collapsing to accordion on mobile.【F:docs/updates/1.00/update_task_list.md†L69-L88】【F:docs/updates/1.00/update_task_list.md†L228-L236】

## Motion & Feedback
- Use micro-interactions (button press scale, success confetti for completed orders, subtle vibrations for warnings) while respecting battery performance guidelines. Transition durations standardised at 200–250ms for navigation, 120ms for hover states.【F:docs/updates/1.00/features_update_plan.md†L83-L97】【F:docs/updates/1.00/update_task_list.md†L239-L246】
