# Fixnado Terraform Baseline

This module provisions the core AWS infrastructure required to host the Fixnado platform in staging and production. It includes networking, compute, data, observability, and secret management components aligned with the Version 1.50 security and reliability targets.

## Provisioned Resources
- Regional VPC with segregated public, private, and database subnets across three availability zones.
- Application Load Balancer secured by ACM TLS certificates with WAF-ready security groups.
- ECS Fargate cluster and service running the Node.js backend with CloudWatch logging and target tracking autoscaling.
- Amazon RDS PostgreSQL (PostGIS-enabled) instance with multi-AZ, KMS encryption, log exports, automated backups, and IAM auth.
- Secrets Manager secrets for runtime configuration, feature toggle manifests, and database credentials encrypted with customer-managed KMS keys.
- CloudWatch alarms (ALB 5xx, ECS CPU) notifying the operations team via SNS email subscription.
- S3 bucket for ALB access logs with Glacier archival and KMS encryption.

## Usage
```
cd infrastructure/terraform
terraform init -backend-config="bucket=fixnado-terraform-state" \
  -backend-config="dynamodb_table=fixnado-terraform-locks" \
  -backend-config="key=env/staging/terraform.tfstate" \
  -backend-config="region=eu-west-2"
terraform plan -var-file=environments/staging.tfvars
terraform apply -var-file=environments/staging.tfvars
```
Repeat with `production.tfvars` once staging is healthy. Backend configuration should point at an encrypted S3 bucket and DynamoDB lock table created via the platform governance account.

To confirm both environments remain aligned, execute the environment parity audit from the repository root:

```
node scripts/environment-parity.mjs
```

The script validates that staging and production tfvars expose the same keys, compares feature toggle manifests, and alerts when rollout differences exceed 50 percentage points.

### CI/CD automation
- The **Terraform Deployments** GitHub Actions workflow (`.github/workflows/infrastructure-deploy.yml`) runs plans automatically for staging and production on pull requests and on pushes to `main`.
- The workflow assumes AWS roles provided via repository secrets (`AWS_ROLE_TO_ASSUME_STAGING` / `AWS_ROLE_TO_ASSUME_PRODUCTION`) and reads backend configuration from per-environment secrets (`TF_STATE_BUCKET_*`, `TF_LOCK_TABLE_*`).
- Plan artefacts and JSON change summaries are published for auditing; manual `workflow_dispatch` runs can apply changes with or without auto-approval after the change advisory board signs off.
- Plans will fail if tfvars are out of sync or if the state lock table/bucket is unavailable, preventing drift from entering production unnoticed.

### Blue/green topology
- The Application Load Balancer exposes a primary HTTPS listener on port 443 and a validation listener on port 9443 that is restricted to the Fixnado operations NAT ranges defined in `blue_green_validation_cidrs`.
- ECS services deploy through AWS CodeDeploy with paired blue/green target groups, automated rollback on ALB 5xx/CPU alarms, and a 20-minute bake window for validation traffic.
- The validation listener feeds the `test` route in CodeDeploy so smoke and integration tests can hit the new tasks without disturbing live traffic; the CodeDeploy failure alarm fans out to the central SNS topic.
- Detailed execution guidance (including traffic shifting, synthetic checks, and rollback commands) is documented in `../runbooks/blue-green-deployment.md`.

### Secret rotation
- Runtime secrets (`fixnado/<env>/app-config`) are seeded by Terraform and rotated using `node scripts/rotate-secrets.mjs --environment <env> --targets app-config,database`.
- The script generates cryptographically secure values, preserves metadata such as owners and rotation timestamps, and writes new versions back to AWS Secrets Manager via the CLI.
- Feature toggle payloads are stored in dedicated Secrets Manager secrets and referenced by ARN so the application can fetch them at boot without bundling configuration files.

## Security & Compliance
- Every resource inherits baseline GDPR tags and environment metadata for CMDB integration.
- Secrets are rotated through AWS Secrets Manager and consumed by ECS tasks using the execution IAM role policy.
- Database credentials never leave Secrets Manager; Terraform fetches the current version at apply time for initial bootstrap only.
- ALB is locked to HTTPS with TLS 1.2+ cipher suites; HTTP to HTTPS redirect can be enabled via additional listener rules if required.

## Disaster Recovery
- Multi-AZ deployments keep compute and database workloads resilient to single AZ failure.
- Daily automated backups with 7-day retention in staging and 14-day retention in production ensure point-in-time recovery.
- ALB access logs archived to Glacier enable forensic analysis compliant with security policies.

## Future Enhancements
- Introduce AWS WAF managed rules and Shield Advanced association with the ALB.
- Add EventBridge bus, SQS queues, and Step Functions for booking orchestration.
- Expand monitoring with latency, error budget, and database connection alarms integrated with PagerDuty.
