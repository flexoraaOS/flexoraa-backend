# Hardcoded Value Removal Checklist

This document certifies the removal of hardcoded values, mocks, and stubs from the codebase as part of Phase 8.

## 1. Credentials & Secrets
- [x] **Database Credentials**: Moved to `DATABASE_URL` env var.
- [x] **JWT Secrets**: Moved to `JWT_SECRET` / `JWT_REFRESH_SECRET`.
- [x] **API Keys**: Gemini, Pinecone, Twilio, Meta keys moved to env vars.
- [x] **Webhooks**: Secrets moved to `WEBHOOK_SECRET`.

## 2. Business Data
- [x] **Phone Numbers**: Removed test numbers (e.g., `+1234567890`) from source code.
- [x] **Email Addresses**: Removed hardcoded emails; seeded via `seed-staging.js`.
- [x] **Template IDs**: WhatsApp template names moved to `templates` table.
- [x] **Campaign IDs**: No longer hardcoded; fetched dynamically.

## 3. Logic & Stubs
- [x] **Auth Stub**: Replaced with real JWT `authService`.
- [x] **AI Stub**: Replaced `geminiService` mock with real Google AI calls.
- [x] **Vector Stub**: Replaced `pineconeService` mock with real vector search.
- [x] **WhatsApp Stub**: Replaced with real Meta Cloud API calls.

## 4. Configuration
- [x] **Feature Flags**: Moved from code constants to `config/features.js`.
- [x] **Rate Limits**: Configurable via env vars.
- [x] **Ports/URLs**: `PORT` and `API_URL` are configurable.

## Verification
Run the detection script to verify no remaining hardcoded values:
```bash
./scripts/clean-hardcoded.sh
```
