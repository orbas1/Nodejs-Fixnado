# Web Logic Flow Map Overview

## Swimlanes
- Authentication, Navigation, Dashboard, Marketplace, Resources, Settings, Reporting.

## Major Nodes
- Login → Role detection → Dashboard routing.
- Command palette search → entity detail modal or new tab navigation.
- Marketplace filter change → results refresh → provider comparison → quote request submission.
- Report builder → schedule export → confirmation.
- Settings change → validation → confirmation toast → audit log entry.

## Error Paths
- API failure triggers retry flow with toast + support link.
- Permission denied routes to request access modal.
- Session timeout prompts re-authentication overlay.

## Documentation
- Maintained in Figma `Web_Flows_v150.fig`; export PDF to `/docs/web/logic/` with version stamp.
- Each node labelled with analytics event ID for instrumentation alignment.
