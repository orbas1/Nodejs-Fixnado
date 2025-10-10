# Logic Flow Map

```
Login
  ├─ Persona Check (Seeker | Provider | Admin)
  │    ├─ Seeker → Explorer Dashboard → (Search → Compare → Book → Track) → Feedback
  │    ├─ Provider → Console → (Accept → Plan → Deliver → Complete) → Invoice/Review
  │    └─ Admin → Governance Hub → (Monitor → Alert → Enforce → Report) → Audit Archive
  │
  └─ Global Services
        ├─ Notifications Bus → (Toasts | Inbox | Email/SMS)
        ├─ AI Insight Engine → Recommendations → Quick Actions
        ├─ Compliance Service → Blocks/Warnings → Override Requests
        └─ Analytics Pipeline → Dashboards → Export/API
```

- **Decision Nodes:** Compliance status, availability conflicts, payment verification, consent validity.
- **Fallback Paths:** Offline mode (cached data) → limited functionality; escalate to support via help centre.
