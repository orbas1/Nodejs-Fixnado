# Fixnado Platform – Version 1.50 Foundations

This repository contains the Fixnado marketplace platform spanning a Node.js backend, React web client, Flutter mobile app, and shared OpenAPI contracts. Version 1.50 focuses on security hardening, shared architecture, and deployment readiness.

## Projects
- `backend-nodejs`: Express API with MFA, JWT rotation, rate limiting, CORS hardening, and modular services.
- `frontend-reactjs`: Vite-powered React SPA with secure auth context, MFA-aware login/registration, and dynamic profile management.
- `flutter-phoneapp`: Flutter client with encrypted credential storage, MFA flow, and live profile integration.
- `openapi`: Source OpenAPI specification used to generate typed clients for web and mobile.
- `infrastructure/terraform`: AWS Terraform baseline (VPC, ECS Fargate, RDS MySQL, Secrets Manager, CloudWatch alarms) for staging and production environments.
- `docs`: Architecture blueprint, operational runbooks, and promotion checklists.

## Getting Started
1. **Install dependencies**
   ```bash
   cd backend-nodejs && npm install
   cd ../frontend-reactjs && npm install
   cd ../flutter-phoneapp && flutter pub get
   ```
2. **Configure environment variables** via AWS Secrets Manager or `.env` files consumed by `src/config/index.js`.
3. **Run services locally**
   ```bash
   cd backend-nodejs && npm run dev
   cd ../frontend-reactjs && npm run dev
   cd ../flutter-phoneapp && flutter run
   ```

## Dependency Governance
Execute the cross-repo audit script to surface vulnerabilities and outdated dependencies:
```bash
node scripts/audit-dependencies.mjs
```
Use `--ci` within pipelines to fail builds when high/critical issues exist or when Flutter audits cannot be executed.

## Infrastructure Deployment
Terraform configuration lives in `infrastructure/terraform`. Initialise with an S3/DynamoDB backend and apply using the provided environment variable files:
```bash
cd infrastructure/terraform
terraform init -backend-config="bucket=<state-bucket>" -backend-config="dynamodb_table=<lock-table>" \
  -backend-config="key=env/staging/terraform.tfstate" -backend-config="region=eu-west-2"
terraform apply -var-file=environments/staging.tfvars
```
Refer to `docs/ops/backup-dr-runbook.md` and `docs/ops/environment-promotion-checklist.md` before promoting to production.

## Documentation
- `docs/architecture/platform-architecture.md`: Service boundaries, deployment topology, and cross-channel alignment.
- `docs/ops/backup-dr-runbook.md`: Disaster recovery procedures and recovery objectives.
- `docs/ops/environment-promotion-checklist.md`: Pre/post deployment checks and rollback plan.
- `update_docs/1.50`: Planning artefacts, design updates, and milestone trackers for Version 1.50.

## Contributing
Follow the update task list and progress trackers in `update_docs/1.50`. All changes should include:
- Updated documentation and change logs.
- Associated migrations/tests as required.
- Dependency audit results (`node scripts/audit-dependencies.mjs --ci`) attached to CI runs.

For questions, reach out to the Platform Architecture guild or the Design Authority documented in `update_docs/1.50/Design_Change_log.md`.
