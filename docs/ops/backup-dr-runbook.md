# Backup & Disaster Recovery Runbook – Version 1.50

## Objectives
- Guarantee recovery point objectives (RPO) of 15 minutes for transactional workloads and 1 hour for analytics.
- Guarantee recovery time objectives (RTO) of under 60 minutes for API availability and 4 hours for reporting tooling.
- Provide auditable procedures for regulators and enterprise clients.

## Data Protection Inventory
| System | Backup Mechanism | Frequency | Retention | Owner |
| --- | --- | --- | --- | --- |
| Amazon RDS MySQL | Automated snapshots + binary log shipping | Daily snapshots @ 01:00 UTC, binlog every 5 minutes | 7 days (staging), 30 days (production) | Platform Ops |
| Secrets Manager | Versioned secrets with automated rotation | 30-day rotation policy | Previous 5 versions retained | Security Engineering |
| S3 Asset Buckets | Versioning + Glacier IR lifecycle | Continuous | 365 days | Media Platform |
| CloudWatch Logs | Subscription to centralized log account | Streaming | 365 days | Observability |
| Terraform State | Encrypted S3 + DynamoDB locking | Continuous | Indefinite | Platform Ops |

## Backup Validation
1. **Nightly Snapshot Verification**
   - AWS Backup job status checked via CloudWatch Events; failures trigger PagerDuty high urgency alerts.
   - Automated Lambda performs `mysql --execute "SHOW TABLES"` against restored snapshot in isolated subnet weekly.
2. **Secrets Rotation Drill**
   - On the first business day each month, rotate staging DB password and confirm ECS tasks pick up new credentials without downtime.
3. **Disaster Simulation**
   - Quarterly game day: simulate AZ failure by draining tasks in primary AZ, validating traffic reroutes and RDS standby promotion.

## Recovery Procedures
### Backend API Failure (ECS/RDS)
1. Notify incident commander and post status in #incident-war-room (Slack).
2. Assess scope using CloudWatch dashboards and `/health/ready` endpoint.
3. If RDS failure suspected:
   - Trigger `aws rds failover-db-cluster --db-cluster-identifier fixnado-production`.
   - Verify application connectivity; if secrets rotated, update `fixnado/production/database` secret version.
4. If ECS service degraded:
   - Run `aws ecs update-service --cluster fixnado-production-cluster --service fixnado-production-app --force-new-deployment`.
   - Monitor target group health; rollback to previous task definition if 5xx persists for >5 minutes.

### Regional Outage
1. Activate cross-region disaster plan by notifying AWS account manager and enabling replication target in `eu-central-1`.
2. Restore latest snapshot using Terraform workspace `recovery` with `-var environment=production -var aws_region=eu-central-1`.
3. Update Route53 failover records to point to recovery ALB once health checks pass.
4. Communicate ETA and status updates every 15 minutes to leadership and customer success.

### Data Corruption / Accidental Delete
1. Suspend writes via feature flag toggle `maintenanceMode` propagated to clients.
2. Restore point-in-time snapshot to new RDS instance.
3. Run data validation harness (SQL checksum + API smoke tests) before promoting restored instance.
4. Switch application connection string via Secrets Manager secret update and restart ECS tasks.

## Post-Incident
- Complete RCA within 48 hours summarising timeline, impact, contributing factors, and remediation backlog.
- Attach CloudWatch metrics, Terraform state diffs, and Secrets Manager rotation logs to the incident report stored in Confluence.
- Update this runbook after every incident learnings review.
