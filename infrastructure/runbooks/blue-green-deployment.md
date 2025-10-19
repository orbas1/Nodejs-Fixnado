# Blue/Green Deployment Playbook – Fixnado Backend

This runbook codifies the end-to-end procedure for rolling out backend releases through the AWS CodeDeploy blue/green pipeline provisioned by `infrastructure/terraform`. It is optimised for zero-downtime cutovers, deterministic validation, and rapid rollback when health checks or smoke tests fail.

## 1. Prerequisites
- Latest application container image pushed to Amazon ECR with semantic version tag (`fixnado/backend:<semver>`).
- Terraform state is up to date (run `Terraform Deployments` workflow plan against the target environment and confirm there are no pending infrastructure drifts).
- Deployment approver from the change advisory board (CAB) available on Slack `#release-ops` during the window.
- Operations laptop connected through the corporate VPN so validation traffic originates from the permitted CIDR ranges configured in `blue_green_validation_cidrs`.
- PagerDuty rotation notified and on-call acknowledges the deployment start in the incident channel.

## 2. Pre-deployment checks
1. **Cut a release candidate**
   ```bash
   git checkout main
   git pull --ff-only
   npm version --workspace backend-nodejs <semver>
   git push origin main --tags
   ```
   The build/test workflow publishes artefacts and Docker images. Confirm the image digest under the GitHub release summary.
2. **Update task definition image**
   ```bash
   aws ecs describe-task-definition --task-definition fixnado-${ENV}-app \
     --query 'taskDefinition.containerDefinitions[0].image'
   aws ecs register-task-definition \
     --cli-input-json file://deployments/backend-task-definition.json
   ```
   The JSON file should mirror the Terraform definition but point at the new image tag.
3. **Validate Secrets Manager values**
   ```bash
   node scripts/rotate-secrets.mjs --environment ${ENV} --targets app-config --dry-run
   ```
   Ensure the dry-run output shows no missing keys. Abort if secrets need rotation before the rollout.
4. **Confirm observability quiet state**
   - Grafana dashboard `Fixnado / Platform Health` shows error budget usage < 10% in the last 60 minutes.
   - No P1/P2 incidents open in PagerDuty.

## 3. Kick off CodeDeploy deployment
1. Trigger the GitHub Action manually for the environment:
   - Workflow: **Terraform Deployments** → `Run workflow`
   - Inputs: `environment = staging`, `refresh_state = true`, `auto_approve = true`
   - This step refreshes state, creates the deployment group if drifted, and publishes outputs.
2. Register the new task definition revision:
   ```bash
   TASK_DEF=$(aws ecs register-task-definition \
     --cli-input-json file://deployments/backend-task-definition.json \
     --query 'taskDefinition.taskDefinitionArn' --output text)
   ```
3. Create the deployment:
   ```bash
   aws deploy create-deployment \
     --application-name fixnado-${ENV}-ecs \
     --deployment-group-name fixnado-${ENV}-ecs \
     --file-exists-behavior OVERWRITE \
     --description "Fixnado backend ${VERSION}" \
     --target-should-batch true \
     --ecs-services "clusterName=fixnado-${ENV}-cluster,serviceName=fixnado-${ENV}-app" \
     --task-definition "${TASK_DEF}" \
     --ignore-application-stop-failures
   ```
4. Monitor deployment progress:
   ```bash
   aws deploy get-deployment --deployment-id <id> \
     --query 'deploymentInfo.[status,creator,createTime,endTime]'
   aws deploy list-deployments --application-name fixnado-${ENV}-ecs --include-only-statuses InProgress
   ```
   CodeDeploy automatically shifts traffic to the validation listener and waits up to 20 minutes for approval.

## 4. Validation on the green fleet
1. **Run smoke tests against validation listener**
   ```bash
   export VALIDATION_URL="https://app.${ENV}.fixnado.com:${VALIDATION_PORT}"
   newman run postman/collections/backend-smoke.json \
     --env-var baseUrl="$VALIDATION_URL" \
     --delay-request 250 \
     --reporters cli,junit
   ```
   Store the JUnit report in the release vault (`governance/release_vault/${ENV}/${VERSION}/smoke-tests.xml`).
2. **Execute synthetic job lifecycle**
   ```bash
   k6 run performance/scenarios/timeline-bluegreen-smoke.js \
     -e BASE_URL="$VALIDATION_URL" \
     -e AUTH_TOKEN="$VALIDATION_TOKEN"
   ```
   Confirm p95 latency < 450ms and error rate < 1%.
3. **Inspect application metrics**
   - CloudWatch dashboard `Fixnado / ECS` should show the green tasks passing readiness probes.
   - Check CodeDeploy events for `AfterAllowTestTraffic` status.
4. **Approve traffic shift**
   ```bash
   aws deploy continue-deployment --deployment-id <id> --deployment-wait-type READY_WAIT
   ```
   CodeDeploy switches production traffic to the green target group and starts terminating the blue tasks after 10 minutes.

## 5. Post-deployment verification
- Confirm the production listener (`https://app.${ENV}.fixnado.com`) serves the new build by checking the `/health/info` endpoint version hash.
- Ensure the SNS alarm topic did not receive a failure notification (no emails in `staging-ops@fixnado.com` / `noc@fixnado.com`).
- Annotate Grafana dashboard with deployment metadata.
- Update `update_progress_tracker.md` activity log with deployment ID, image digest, and test evidence locations.

## 6. Rollback procedure
1. **Automatic rollback** – If the `fixnado-${ENV}-codedeploy-failures` or ALB 5xx alarm triggers, CodeDeploy halts and reverts traffic to the blue target group automatically. Investigate the CloudWatch Logs stream and stop here.
2. **Manual rollback** – If validation tests fail after traffic shift, execute:
   ```bash
   aws deploy stop-deployment --deployment-id <id> --auto-rollback-enabled
   ```
   Then redeploy the last known good task definition revision (captured in `governance/release_vault/${ENV}/latest-success.json`).
3. **Database or infrastructure rollback** – If the issue ties to a Terraform change, rerun the Terraform workflow with `auto_approve = false`, inspect the plan, and apply the previous state file stored in the S3 backend (`env/${ENV}/terraform.tfstate` version history).
4. Raise a `P1` incident if rollback required downtime or customer impact exceeded SLA; run the post-mortem workflow afterwards.

## 7. Communication
- Publish deployment summary in `#release-ops` with deployment ID, start/end times, and validation evidence links.
- Update the stakeholder Confluence page and append the deployment record to the release vault checklist.
- For production, notify customer success and compliance distribution lists via templated email (stored under `governance/templates/deployment-notice.md`).

Adhering to this playbook ensures every blue/green cutover satisfies the governance guardrails, captures immutable evidence, and keeps rollback within a single command when issues arise.
