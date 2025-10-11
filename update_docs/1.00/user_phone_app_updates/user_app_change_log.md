# User App Change Log — 2025-02-09

- Enhanced live feed widget to support loading indicators, empty state messaging, and high-priority flagging, matching menu/dashboard drawings for Subtask 6.2 readiness.
- Introduced widget tests ensuring render paths and retry callbacks behave consistently, enabling CI adoption once Flutter tooling is provisioned.

## 2025-10-14 — CI Coverage & Governance Alignment
- CI Quality Gates now install Flutter tooling, run `flutter analyze`, execute widget tests with coverage, and upload LCOV artefacts ensuring mobile instrumentation remains in lock-step with React/Node counterparts.
- Rollback playbook documents AppCenter rollback procedure, flag resets, and customer comms so mobile squads can revert staged releases when CI catches regressions.
