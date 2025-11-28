# Flexoraa Production Backend

Enterprise-grade backend for Flexoraa Intelligence OS, replacing legacy n8n workflows with a robust Node.js/Express architecture.

## 🚀 Features

*   **API Gateway:** Express.js with JWT auth, rate limiting, and Zod validation.
*   **Database:** PostgreSQL (Supabase) with migrations and connection pooling.
*   **AI Engine:** Google Gemini Pro integration for lead scoring and content generation.
*   **Vector Search:** Pinecone RAG integration for knowledge base retrieval.
*   **Messaging:** WhatsApp Cloud API (Meta) and Twilio SMS integration.
*   **Email Marketing:** KlickTipp integration.
*   **Security:** AES-256 encryption for PII, IP allowlisting, and replay attack prevention.
*   **Observability:** Structured logging and metrics telemetry.

## 🛠️ Setup & Installation

### Prerequisites
*   Node.js v18+
*   PostgreSQL (Supabase)
*   Redis (for caching and idempotency)

### 1. Install Dependencies
```bash
cd api
npm install
```

### 2. Environment Configuration
Copy the example env file and fill in your secrets:
```bash
cp .env.example .env
```
Refer to `.env.example` for detailed descriptions of all 50+ required variables.

### 3. Database Migration
Run migrations to set up the schema:
```bash
npm run migrate
```

### 4. Seed Data (Staging Only)
Populate the database with realistic test data:
```bash
# Seeds users, campaigns, and 100+ leads
node ../scripts/seed-staging.js

# Seeds vector database (Pinecone)
node ../scripts/seed-vectors.js
```

### 5. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## 🧪 Testing

*   **Unit Tests:** `npm test`
*   **Contract Tests:** `npx jest tests/contracts`
*   **E2E Scenarios:** `npx jest tests/e2e`
*   **Smoke Test:** `node ../scripts/smoke-staging.js http://localhost:3000`

## 📚 Documentation

*   [API Contract Map](./api-contract-map.md) - Detailed frontend-backend interface.
*   [Hardcoded Removal Checklist](./docs/hardcoded-removal-checklist.md) - Audit of removed hardcoded values.
*   [Operational Runbook](./docs/runbook.md) - Guide for maintenance and incident response.

## 🏗️ Architecture

The system follows a layered architecture:
1.  **Routes:** Express routers handling HTTP requests.
2.  **Middleware:** Auth, validation, idempotency, logging.
3.  **Services:** Business logic (Leads, Campaigns, AI, WhatsApp).
4.  **Data Access:** Direct DB queries via `pg` pool.

## 🔒 Security

*   **Authentication:** JWT with refresh tokens.
*   **PII Protection:** Phone numbers and emails are encrypted at rest.
*   **GDPR:** Consent logs track all user opt-ins.
*   **Idempotency:** `X-Idempotency-Key` header supported for critical actions.

## 📦 Deployment

The project is containerized and ready for deployment via Docker or standard Node.js environments.
See `.github/workflows` for CI/CD pipelines.
