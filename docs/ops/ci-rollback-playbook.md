# CI Rollback Playbook — Version 1.00

This playbook documents the operational recovery steps for each artefact covered by the **CI Quality Gates** workflow. Follow th
is guide whenever a deployment, release candidate, or hotfix needs to be rolled back after failing a production smoke test or st
aging verification.

## 1. Trigger Matrix
| Artefact | Primary Pipeline Job | Rollback Entry Point | Owners |
| --- | --- | --- | --- |
| Backend (Node.js) | `backend` | GitHub Actions workflow `Deploy Backend Service` (ArgoCD sync) | Backend Tech Lead, SRE |
| React Web | `frontend` | Vercel promotion pipeline (`production` environment) | Frontend Tech Lead, Marketing Ops |
| Flutter Apps | `flutter` | AppCenter release lane (`provider`, `user`, `serviceman`, `enterprise`) | Mobile Lead, QA Lead |
| Config & Issue Automation | `governance` | Terraform staging rollback + script re-run | DevOps Lead, Programme Manager |

## 2. Decision Flow
1. **Identify failing job** inside the CI Quality Gates run.
2. **Capture artefacts**: download the uploaded coverage LCOV/HTML bundle to evidence failing assertions.
3. **Confirm scope** with the owning squad lead and QA lead before initiating rollback.
4. **Choose rollback path** using the guides below. Always document the incident in the shared tracker and update `update_docs/1.0
0/update_progress_tracker.md` commentary once the rollback completes.

## 3. Backend Service Rollback
1. **Freeze deployments** by disabling the `deploy-backend` workflow dispatch trigger in GitHub.
2. **Restore previous container** using ArgoCD: `argocd app rollback fixnado-backend <REVISION>`. Use the last healthy revision t
agged in the release notes.
3. **Reapply database migrations** if the failing release introduced schema changes. Execute `npm run sequelize:migrate:undo --to
 <MIGRATION_ID>` within the staging environment, then confirm parity with `scripts/environment-parity.mjs`.
4. **Re-run CI Quality Gates backend job** on the rollback branch to ensure the failing test/coverage issue is resolved.
5. **Update telemetry**: create a post-mortem entry referencing the failing coverage metric or security scan.

## 4. React Web Rollback
1. **Invalidate CDN cache** by triggering Vercel rollback: `vercel rollback production` targeting the last successful build ID.
2. **Revert feature toggles** via the admin rollout panel or `scripts/environment-parity.mjs` to ensure staging mirrors producti
on before redeploying.
3. **Flush Chromatic baselines** if the regression impacted Storybook snapshots to prevent false positives on the restored build.
4. **Re-execute `npm test` and `npm run lint`** locally to confirm the gating failure is fixed prior to republishing.
5. **Log change** in `update_docs/1.00/frontend_updates/change_log.md` with rollback details and owner approvals.

## 5. Flutter Application Rollback
1. **Pause staged rollout** in AppCenter: cancel in-flight deployments across all channels (provider/user/serviceman/enterprise).
2. **Re-sign previous build artifacts** stored in the secure artefact bucket (S3 `fixnado-mobile-builds`). Attach the regenerated
 IPA/APK to the halted release lanes.
3. **Revert feature flags** affecting mobile experiences using Secrets Manager toggles; verify via the `feature_toggles` admin e
ndpoint.
4. **Execute `flutter test --coverage` and `flutter analyze`** locally; confirm the restored branch meets widget coverage thresho
lds documented in the CI output.
5. **Update mobile release notes** and notify Customer Support to align user communications.

## 6. Governance Automation Rollback
1. **Re-run `scripts/issue-intake.mjs`** on the last known-good commit to regenerate `issue_list.md` and `fix_suggestions.md`.
2. **Restore feature toggle manifests** from Terraform state or Git history if parity script flagged drift.
3. **Notify Design Ops and Compliance** using the mobilisation Slack channel to ensure SLA dashboards are recalculated.
4. **Record rollback** in `update_docs/1.00/change_log.md` under the relevant date with impacted artefacts and remediation owner.

## 7. Audit & Communication Checklist
- Update the programme tracker commentary with rollback context, root cause, and prevention actions.
- Attach coverage screenshots or vulnerability reports to the incident ticket for compliance evidence.
- Schedule a follow-up with QA + Engineering to raise coverage thresholds or close the vulnerability that triggered the rollback.
- Ensure runbooks are versioned in Git and cross-linked from the release notes.

## 8. Preventative Actions
- Enforce branch protection: require CI Quality Gates success, dependency audit workflow, and code review before merge.
- Monitor coverage thresholds weekly; raise the backend branch minimum from 48 → 55 and the frontend branch minimum from 50 → 60
after additional suites land.
- Automate Slack alerts when governance job fails so design, QA, and compliance leads react before deployment promotion windows.

**Owners:** DevOps Lead (primary), QA Lead (secondary). Document all executions inside the shared `ops/incident-log` workspace.
