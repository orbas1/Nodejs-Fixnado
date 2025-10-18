# User Profile Changes

- Refactored persona selection logic to derive tabs, stats, and actions from `ROLE_PROFILE_THEMES`, resetting invalid personas automatically and keeping active tab state consistent across sessions.【F:frontend-reactjs/src/pages/Profile.jsx†L340-L407】【F:frontend-reactjs/src/pages/Profile.jsx†L520-L627】
- Modernised the hero layout and focus overlays with timezone badges, refresh controls, and reusable detail modals so profile metrics, security activity, and avatar previews share the same accessible patterns.【F:frontend-reactjs/src/pages/Profile.jsx†L528-L758】【F:frontend-reactjs/src/pages/Profile.jsx†L1088-L1151】
