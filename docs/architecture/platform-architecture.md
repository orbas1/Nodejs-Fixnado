# Fixnado Platform Architecture Blueprint – Version 1.50

## Overview
Fixnado operates as a secure, cloud-native marketplace platform that coordinates work between customers, vetted providers, and Fixnado operations teams. Version 1.50 consolidates security foundations and introduces forward-compatible boundaries so geospatial intelligence, rentals, and collaboration features can be layered without destabilising the core. The blueprint below defines the production target state spanning backend services, client applications, integrations, and infrastructure.

## Domain & Service Boundaries
| Domain | Responsibilities | Primary Components | Key Integrations |
| --- | --- | --- | --- |
| Identity & Access | Authentication, MFA, session rotation, device trust scoring, organisation membership | `backend-nodejs` auth controller & services, Redis-backed session cache (future), AWS Cognito/Secrets Manager, MFA enrolment UI | AWS KMS, Secrets Manager, SES/SNS for OTP delivery |
| Marketplace & Content | Service listings, rentals, availability, marketing content | Marketplace service (planned), content CMS (future), React/Flutter discovery flows | OpenSearch for search, S3 asset storage, CDN |
| Booking & Workforce | Booking lifecycle, recurrence, routing, SLA tracking | Booking service (planned), workflow orchestrator queues, provider calendar sync | EventBridge/SQS, notification providers (SendGrid, Twilio, Firebase) |
| Zone Intelligence | Geospatial modelling, zone analytics, matching heuristics | PostGIS-enabled database schemas, analytics workers, React heatmaps | Mapbox/MapLibre tiles, GeoJSON ingestion pipelines |
| Compliance & Trust | Verification, dispute resolution, policy enforcement, audit evidence | Compliance microservice (future), document storage, admin dashboards | Onfido/ComplyAdvantage, AWS S3 Glacier, analytics warehouse |
| Monetisation | Commission calculation, invoice generation, ad campaign targeting | Billing service (future), Stripe/Adyen payment connectors, Finova Ads integration | Stripe/Adyen, Fixnado Ads, data warehouse |
| Observability & Governance | Metrics, logs, tracing, runbooks, change control | AWS CloudWatch, OpenTelemetry collector, PagerDuty integrations, Terraform state | Terraform Cloud/Backend S3, AWS GuardDuty, Security Hub |

Each domain exposes REST APIs adhering to the versioned OpenAPI specification housed in `openapi/fixnado.v1.json`. Client SDKs for React and Flutter are generated via `scripts/generate-clients.mjs` to keep models aligned.

## Runtime Topology
```
+-------------------------+      +------------------------+      +---------------------+
|  React Web App          |      |  Flutter Mobile Apps   |      |  Admin/Internal UIs |
|  (Vite, Auth Context)   |      |  (Provider & User)     |      |  (React/Next planned)|
+-----------+-------------+      +-----------+------------+      +----------+----------+
            | JWT/MFA                        |                                  |
            v                                v                                  v
+-------------------------------------------------------------------------------------+
|                       AWS Application Load Balancer (HTTPS)                        |
+-------------------------------+-------------------------------+--------------------+
                                |
                                v
+-------------------------------------------------------------------------------------+
|                    AWS ECS Fargate Cluster – backend-nodejs service                |
|  - Express app with rate limiting, security middleware                             |
|  - Serves REST APIs, health checks, WebSocket upgrades                             |
|  - Publishes domain events to EventBridge (roadmap)                                |
+-------------------------------+-------------------------------+--------------------+
                                |
                 +--------------+--------------+                +------------------+
                 |                             |                |                  |
                 v                             v                v                  v
        +----------------+         +-------------------+   +-----------+   +--------------+
        | Amazon RDS     |         | Amazon ElastiCache|   | AWS S3    |   | AWS Secrets  |
        | MySQL (SSL)    |         | Redis (sessions)  |   | Assets    |   | Manager/KMS  |
        +----------------+         +-------------------+   +-----------+   +--------------+
                 |
                 v
        +-----------------------+
        | Analytics Warehouse   |
        | (Athena/Redshift)     |
        +-----------------------+
```

Additional internal services (CI, observability, analytics) plug into the same VPC using private subnets. Outbound access is controlled via NAT gateways and security groups managed by Terraform.

## Data Flow Summary
1. **Authentication:**
   - Users authenticate through React or Flutter clients which call `/auth/login` on the Node.js API.
   - MFA secrets are encrypted in transit and at rest using AES-256 GCM via `mfaService` before storage in MySQL.
   - Refresh-token rotation utilises signed JWTs stored in encrypted secure storage on clients; server persists rotation history for anomaly detection.

2. **Request Processing:**
   - Rate limiting and context tracking middleware annotate requests with correlation IDs and tenancy metadata for observability.
   - Controllers validate payloads using Zod schemas and orchestrate domain services.

3. **Data Persistence:**
   - Primary relational data lives in RDS MySQL with strict SSL enforcement and audit columns introduced in `20240401000000-security-foundations.js`.
   - Secrets and configuration parameters are resolved via the `secretManager` abstraction which prioritises AWS Secrets Manager then environment variables.

4. **Client Synchronisation:**
   - Generated SDKs provide typed clients for React/Flutter, aligning DTOs and validation logic with backend definitions.
   - Health and telemetry endpoints expose readiness/liveness for load balancers and monitoring dashboards.

## Environment Strategy
- **Local:** Docker Compose (roadmap) bootstraps MySQL + LocalStack. Developers use `.env.local` combined with `secretManager` fallbacks.
- **Staging:** Terraform provisions isolated VPCs, Fargate services, and managed databases with automated nightly snapshots and CloudWatch alarms. Staging mirrors production security (MFA required, TLS 1.2+).
- **Production:** Multi-AZ deployments with encrypted backups, WAF/Shield integration, and blue/green deployment pipelines executed via GitHub Actions + Terraform Cloud apply steps.

## Deployment Workflow
1. Code merged to `main` triggers GitHub Actions:
   - Install dependencies and run lint/test suites for each workspace.
   - Execute `node scripts/audit-dependencies.mjs --ci` for security posture enforcement.
   - Build Docker image and push to Amazon ECR.
2. Terraform pipelines apply environment-specific plans using `environments/<env>.tfvars`.
3. After successful infrastructure deployment, ECS rolling update publishes new task definition revisions.
4. Post-deploy smoke tests call `/health/ready` and `/health/live` endpoints; alerts configured via CloudWatch + PagerDuty.

## Observability & Governance
- **Logging:** Structured JSON logs emitted from Express controllers via `morgan` (pluggable to Winston) and shipped to CloudWatch for long-term retention.
- **Metrics:** Rate limit counters, authentication failures, and MFA enrolment stats exported to CloudWatch; future work will integrate OpenTelemetry collectors.
- **Tracing:** Request IDs from middleware propagate to logs and clients for correlation. OTel instrumentation is staged for Task 8.
- **Security Monitoring:** AWS GuardDuty + Security Hub aggregate findings, while Secrets Manager rotation policies enforce 90-day credentials refresh.

## Future Extensions
- Event-driven microservices for booking orchestration, inventory, and messaging will consume EventBridge buses and share a data mesh pattern.
- GraphQL gateway evaluation (post-Task 3) may provide aggregated data to clients while REST APIs remain primary integration surface.
- Edge caching and CDN-based geolocation routing will optimise zone-aware content delivery once Task 2 geospatial services are in place.

## Cross-Channel Experience Alignment
- Web and Flutter clients consume the same OpenAPI-generated SDKs, guaranteeing DTO parity and shared validation logic across login, profile, and MFA flows.
- Navigation hierarchies for Admin, Provider, and Customer personas mirror the information architecture captured in the design repository, ensuring dashboards and quick actions follow identical naming and ordering conventions.
- Feature flags stored in Secrets Manager toggle channel-specific experiments (e.g., AI copilot beta) while maintaining default behaviour parity; rollouts are orchestrated through the environment promotion checklist.
- Shared telemetry schema defines correlation IDs, user roles, and device metadata so analytics tooling compares task completion rates across platforms without bespoke instrumentation.

This blueprint should be revisited after each major release to ensure architectural decisions remain aligned with product evolution and compliance requirements.
