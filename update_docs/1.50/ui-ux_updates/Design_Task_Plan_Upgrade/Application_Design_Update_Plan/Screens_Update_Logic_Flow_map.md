# Screens Update Logic Flow Map

| Persona | Entry Screen | Decision Nodes | Downstream Screens | Exit Condition |
| --- | --- | --- | --- | --- |
| Provider | Operate Dashboard | Job urgency, compliance status, team availability | Job Detail, Schedule, Compliance Centre, Inventory | Job completed with evidence + review request sent |
| Provider | AI Inbox | Message type (client/system/team), consent, escalation level | Chat Thread, Agora Modal, Dispute Workflow | Conversation resolved or escalated |
| User | Discover Explorer | Filter selection, ad engagement, service vs. rental | Provider Detail, Custom Job Wizard, Booking Wizard | Booking confirmed or custom job request submitted |
| User | Booking Timeline | Status (pre-service, in-progress, completed) | Map Tracking, Reschedule Flow, Payment Review | Service delivered + review captured |
