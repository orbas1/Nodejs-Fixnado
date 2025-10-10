# Environment Promotion Checklist – Version 1.50

The checklist standardises promotion from staging to production for each release train. Owners must sign off every step before triggering `terraform apply` against production.

## Pre-Promotion Gate
- [ ] All feature branches merged and passing CI (lint, unit, integration) with green badges.
- [ ] `scripts/audit-dependencies.mjs --ci` executed with no High/Critical vulnerabilities outstanding.
- [ ] Staging observability dashboard shows 24 hours of healthy metrics (HTTP 5xx < 0.1%, p95 latency < 300ms, CPU < 65%).
- [ ] QA sign-off recorded in Jira with linked test plan execution results.
- [ ] Data migrations tested against staging snapshot and validated with rollback plan.
- [ ] Product, Engineering, and Support leads confirm launch messaging and support rota coverage.

## Deployment Steps
1. Tag release (`git tag v1.50.x && git push origin v1.50.x`).
2. Trigger Terraform plan for production:
   ```
   terraform plan -var-file=environments/production.tfvars -out prod.plan
   ```
3. Peer review plan output; store approval in the release ticket.
4. Apply infrastructure changes:
   ```
   terraform apply prod.plan
   ```
5. Deploy application containers via GitHub Actions workflow `deploy-backend.yml` targeting production.
6. Validate ECS service stability (task health, target group metrics) for 15 minutes.

## Post-Deployment Verification
- [ ] `/health/live` and `/health/ready` return 200 from production ALB.
- [ ] Smoke test API endpoints using generated SDKs (auth login, refresh, MFA challenge, profile retrieval).
- [ ] Validate database migrations: run `SELECT COUNT(*)` on new tables and ensure audit columns populated.
- [ ] Confirm Secrets Manager version increments for rotated tokens.
- [ ] Execute synthetic transactions from Grafana k6 scenario; confirm KPIs within thresholds.
- [ ] Update status page and notify stakeholders of successful promotion.

## Rollback Plan
- Rollback Terraform using previous state snapshot stored in S3 (retain `prod.plan` for diff reference).
- Re-deploy previous ECS task definition revision using `aws ecs update-service --force-new-deployment --task-definition <arn>`.
- Restore RDS from last automated snapshot if schema changes cause regressions (RTO < 60 minutes).
- Trigger incident management protocol if rollback initiated, documenting timeline in the release ticket.
