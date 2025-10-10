# Fixnado Terraform Baseline

This module provisions the core AWS infrastructure required to host the Fixnado platform in staging and production. It includes networking, compute, data, observability, and secret management components aligned with the Version 1.50 security and reliability targets.

## Provisioned Resources
- Regional VPC with segregated public, private, and database subnets across three availability zones.
- Application Load Balancer secured by ACM TLS certificates with WAF-ready security groups.
- ECS Fargate cluster and service running the Node.js backend with CloudWatch logging and target tracking autoscaling.
- Amazon RDS MySQL instance with multi-AZ, KMS encryption, log exports, and automated backups.
- Secrets Manager secrets for runtime configuration and database credentials encrypted with customer-managed KMS keys.
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

## Security & Compliance
- Every resource inherits baseline GDPR tags and environment metadata for CMDB integration.
- Secrets are rotated through AWS Secrets Manager and consumed by ECS tasks using the execution IAM role policy.
- Database credentials never leave Secrets Manager; Terraform fetches the current version at apply time for initial bootstrap only.
- ALB is locked to HTTPS with TLS 1.2+ cipher suites; HTTP to HTTPS redirect can be enabled via additional listener rules if required.

## Disaster Recovery
- Multi-AZ deployments keep compute and database workloads resilient to single AZ failure.
- Daily automated backups with 7-day retention in staging and 30-day retention in production ensure point-in-time recovery.
- ALB access logs archived to Glacier enable forensic analysis compliant with security policies.

## Future Enhancements
- Introduce AWS WAF managed rules and Shield Advanced association with the ALB.
- Add EventBridge bus, SQS queues, and Step Functions for booking orchestration.
- Expand monitoring with latency, error budget, and database connection alarms integrated with PagerDuty.
