# Flexoraa Production Backend

**Status:** 🚧 Phase 1 - Foundation (In Progress)

AI-powered lead management & WhatsApp marketing automation with production-grade infrastructure.

---

## 📋 Project Overview

This backend replaces n8n workflows with native Node.js/Express services, implementing:
- ✅ Lead Conversion Bot with AI chat
- ✅ WhatsApp/KlickTipp automation
- ✅ Lead Generation API
- ✅ Chat Responder with conversation memory

**Architecture:** Multi-tenant SaaS | Cloud: Supabase | Orchestration: Docker Compose (staging), EKS (production)

---

## 🚀 Quick Start (Staging)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- PostgreSQL client (psql)

### 1. Clone & Setup
```bash
# Clone repository
git clone <repo-url>
cd n8n-production-backend

# Copy environment template
cp .env.example .env

# Edit .env with your credentials (or leave stubs for Phase 1 testing)
nano .env
```

### 2. Start Services
```bash
# Start all services (Postgres, Redis, API, Prometheus, Grafana)
docker-compose up -d

# Check service health
docker-compose ps
```

### 3. Run Migrations
```bash
# Windows
scripts\migrate.bat up

# Linux/Mac
chmod +x scripts/migrate.sh
./scripts/migrate.sh up
```

### 4. Seed Demo Data (Optional)
```bash
psql -h localhost -U postgres -d flexoraa -f database/seeds/demo_data.sql
```

### 5. Verify Services
- **API Health:** http://localhost:3000/health
- **API Metrics:** http://localhost:3000/metrics
- **Grafana:** http://localhost:3001 (admin/admin)
- **Prometheus:** http://localhost:9090

---

## 📊 Phase 1 Status

### ✅ Completed
- [x] Database schema with 6 migrations (immutable consent_log, audit trail, assignment queue)
- [x] Docker Compose staging environment
- [x] Migration runner scripts (bash & batch)
- [x] Demo seed data
- [x] Prometheus monitoring config
- [x] Alert rules (API health, workflows, security)
- [x] `.env.example` with all configuration options

### 🚧 In Progress Now
- [ ] Core service stubs (Gemini, Pinecone, WhatsApp, Twilio, KlickTipp)
- [ ] Express API routes and controllers (4 workflows)
- [ ] Authentication middleware (JWT + API key + RBAC)
- [ ] Webhook signature verification
- [ ] Idempotency middleware
- [ ] Rate limiting (Redis-backed)
- [ ] Unit tests (≥80% coverage target)
- [ ] Grafana dashboards
- [ ] Postman collection
- [ ] GitHub Actions CI
- [ ] README documentation

### 📝 Phase 1 Acceptance Criteria
**8 criteria must pass before Phase 2:**
1. ✅ Repo accessible, CI passing — [Pending: CI setup]
2. ✅ docker-compose boots all services — [Completed: docker-compose.yml ready]
3. ✅ Migrations run, demo data seeded — [Completed: 6 migrations + seeds]
4. ⏳ Health endpoints functional — [In Progress]
5. ⏳ Postman smoke tests pass — [In Progress]
6. ✅ Prometheus + Grafana visible — [Completed: configs ready]
7. ⏳ Pinecone index created, retrieval test — [Not Started]
8. ✅ consent_log immutability demo — [Completed: triggers prevent UPDATE/DELETE]

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           Flexoraa API Gateway               │
│         (Express.js + TypeScript)            │
└──────┬────────────────────────┬──────────────┘
       │                        │
   ┌───▼───────┐          ┌────▼─────────┐
   │ Postgres  │          │    Redis     │
   │ (Supabase)│          │ (Rate Limit) │
   └───────────┘          └──────────────┘
       │
   ┌───▼───────────────────────────┐
   │  External Services            │
   │  - Google Gemini (AI)         │
   │  - Pinecone (Vector RAG)      │
   │  - WhatsApp Business API      │
   │  - Twilio (Voice)             │
   │  - KlickTipp (Email Marketing)│
   └───────────────────────────────┘
```

---

## 📁 Project Structure

```
n8n-production-backend/
├── api/                          # Express API source
│   ├── src/
│   │   ├── config/               # Configuration loaders
│   │   ├── controllers/          # Workflow controllers
│   │   ├── middleware/           # Auth, rate limiting, validation
│   │   ├── routes/               # API route definitions
│   │   ├── services/             # External service integrations
│   │   ├── schemas/              # Zod validation schemas
│   │   └── utils/                # Helper functions
│   ├── tests/                    # Unit & integration tests
│   └── package.json
├── database/
│   ├── migrations/               # SQL migration files (001-006)
│   └── seeds/                    # Demo data
├── infrastructure/
│   ├── docker-compose/           # Docker configurations
│   ├── kubernetes/               # EKS Helm charts (Phase 4)
│   └── terraform/                # IaC for AWS (Phase 4)
├── monitoring/
│   ├── prometheus/               # Prometheus config & alerts
│   └── grafana/                  # Dashboards & provisioning
├── scripts/                      # Utility scripts (migrations, backups)
├── docs/                         # Documentation (OpenAPI, runbooks)
└── docker-compose.yml            # Staging environment
```

---

## 🔐 Security & Compliance

- **Immutable Consent Log:** Append-only table with triggers preventing UPDATE/DELETE
- **PII Encryption:** KMS envelope encryption for phone/email (Phase 3)
- **Webhook Security:** Signature verification + replay prevention with nonce storage
- **Idempotency:** X-Request-Id header tracking for 7 days
- **Rate Limiting:** Per-tenant, Redis-backed
- **Audit Trail:** All lead changes logged with actor tracking
- **RBAC:** Role-based access control with IP allowlisting for admin APIs

---

## 🧪 Testing

```bash
cd api

# Unit tests
npm test

# Integration tests (Phase 2)
npm run test:integration

# Smoke tests (Phase 2)
npm run smoke-test:staging
```

---

## 📦 Workflows Implemented

### 1. Lead Conversion Bot (Workflow 1)
- AI-powered conversational agent
- Pinecone RAG for product knowledge
- WhatsApp template messaging
- Twilio voice fallback with consent check
- Lead scoring with explainability

### 2. WhatsApp/KlickTipp Automation (Workflow 2)
- KlickTipp webhook triggers
- Template message sending (with governance/sandbox mode)
- "STOP" keyword detection → opt-out to consent_log
- Auto-responder templates

### 3. Lead Generation API (Workflow 3)
- POST /api/webhooks/leados (JWT protected)
- AI-generated marketing hooks
- Campaign + lead data merging
- Structured JSON output

### 4. Chat Responder (Workflow 4)
- WhatsApp message webhook
- AI contextual replies with Gemini
- Conversation memory (Postgres-backed)
- Multi-account support

---

## 🛠️ Environment Variables

See [`.env.example`](.env.example) for full list. Key variables:

- **Database:** `POSTGRES_HOST`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- **Redis:** `REDIS_HOST`, `REDIS_PASSWORD`
- **AI:** `GEMINI_API_KEY`, `PINECONE_API_KEY`
- **WhatsApp:** `WHATSAPP_ACCESS_TOKEN`, phone number IDs
- **Security:** `JWT_SECRET`, `AWS_KMS_KEY_ID`, `ASSIGNMENT_HMAC_SECRET`

**Phase 1 Stub Mode:** Set `ENABLE_*` feature flags to `false` to run with service stubs.

---

## 📊 Monitoring

- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3001 (admin/admin)
- **Alerts:** Configured for API health, high error rates, workflow failures

---

## 🚢 Deployment

### Staging
```bash
docker-compose up -d
```

### Production (Phase 4)
- EKS cluster with Helm charts
- AWS Secrets Manager for credentials
- RDS Postgres with row-level security
- Production Pinecone index
- Slack alerting

**⚠️ Cost Approval Required:** Production infrastructure provisioning requires written approval of cost estimate.

---

## 📝 Documentation

- **OpenAPI Spec:** `docs/api/openapi.yaml` (Phase 2)
- **Operations Runbook:** `docs/runbook.md` (Phase 6)
- **Architecture:** `docs/architecture.md` (Phase 6)

---

## 🤝 Commercial

**Phase 1 Deliverables:**
- Staging environment with Docker Compose ✅
- Database migrations & seed data ✅
- Core service stubs (in progress)
- Basic monitoring & alerting ✅
- CI/CD foundation (in progress)

**Next Phases:**
- Phase 2: Complete workflow implementation
- Phase 3: Security & compliance hardening
- Phase 4: Production infrastructure (EKS, IaC)
- Phase 5: CI/CD automation
- Phase 6: Documentation & handoff

**Estimated Costs:** TBD - Line-by-line fixed-price bid + monthly OPEX breakdown required before Phase 4.

---

## 📞 Support

For questions or issues during development, contact the development team.

---

## 📜 License

Proprietary - Flexoraa. All rights reserved.
