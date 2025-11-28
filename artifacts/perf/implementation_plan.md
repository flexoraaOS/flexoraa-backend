# Implementation Plan: Full Backend Build

**Goal:** Complete the Flexoraa Backend to match the "Production Ready" PRD.
**Focus:** AgentOS (Unified Inbox), Payments, Analytics, and Team Management.

## User Review Required
> [!IMPORTANT]
> This plan introduces significant new modules (Instagram, Facebook, Razorpay). Please ensure you have the necessary API credentials for these services.

## Proposed Changes

### Phase 1: AgentOS - Unified Inbox (High Priority)
**Goal:** Enable Instagram and Facebook integration to complete the "Unified Inbox".

#### [NEW] [instagramService.js](file:///c:/Users/Aaryaman%20Jaiswal/Desktop/n8n-production-backend/api/src/services/whatsapp/instagramService.js)
- Implement Graph API client for Instagram Direct Messages.
- Handle text, image, and story reply messages.

#### [NEW] [facebookService.js](file:///c:/Users/Aaryaman%20Jaiswal/Desktop/n8n-production-backend/api/src/services/whatsapp/facebookService.js)
- Implement Graph API client for Facebook Messenger.

#### [MODIFY] [webhooks.js](file:///c:/Users/Aaryaman%20Jaiswal/Desktop/n8n-production-backend/api/src/routes/webhooks.js)
- Add routes for `/instagram` and `/facebook` webhooks.
- Verify Meta webhook signatures.

#### [NEW] [unifiedInboxService.js](file:///c:/Users/Aaryaman%20Jaiswal/Desktop/n8n-production-backend/api/src/services/unifiedInboxService.js)
- Normalize messages from WhatsApp, Insta, FB into a common `Message` format.
- Store in `messages` table with `channel` field.

---

### Phase 2: Payments & Subscriptions (High Priority)
**Goal:** Monetization via Razorpay.

#### [NEW] [razorpayService.js](file:///c:/Users/Aaryaman%20Jaiswal/Desktop/n8n-production-backend/api/src/services/payment/razorpayService.js)
- Wrapper for `razorpay` SDK.
- Create orders, verify signatures, manage subscriptions.

#### [NEW] [subscriptions.js](file:///c:/Users/Aaryaman%20Jaiswal/Desktop/n8n-production-backend/api/src/routes/subscriptions.js)
- `POST /subscribe`: Create subscription.
- `POST /cancel`: Cancel subscription.
- `GET /invoices`: List invoices.

#### [NEW] [020_payments_schema.sql](file:///c:/Users/Aaryaman%20Jaiswal/Desktop/n8n-production-backend/database/migrations/020_payments_schema.sql)
- Tables: `subscriptions`, `payments`, `invoices`, `plans`.

---

### Phase 3: Business Analytics (Medium Priority)
**Goal:** ROI and Performance Dashboards.

#### [NEW] [analytics.js](file:///c:/Users/Aaryaman%20Jaiswal/Desktop/n8n-production-backend/api/src/routes/analytics.js)
- `GET /roi`: Campaign ROI metrics.
- `GET /conversion`: Lead conversion funnel.
- `GET /team`: SDR performance leaderboard.

#### [NEW] [analyticsService.js](file:///c:/Users/Aaryaman%20Jaiswal/Desktop/n8n-production-backend/api/src/services/analyticsService.js)
- Complex SQL queries to aggregate data from `leads`, `campaigns`, `messages`.

---

### Phase 4: Team Management & Bulk Actions (Medium Priority)
**Goal:** Enterprise features.

#### [MODIFY] [admin.js](file:///c:/Users/Aaryaman%20Jaiswal/Desktop/n8n-production-backend/api/src/routes/admin.js)
- Add `POST /invite`: Send email invitation.
- Add `PATCH /users/:id/role`: Update user role.

#### [MODIFY] [leads.js](file:///c:/Users/Aaryaman%20Jaiswal/Desktop/n8n-production-backend/api/src/routes/leads.js)
- Add `POST /bulk/update`: Mass update leads.
- Add `POST /bulk/assign`: Mass assign to campaign.

## Verification Plan

### Automated Tests
- Unit tests for `instagramService` and `razorpayService` (mocked).
- Integration tests for webhook handlers.

### Manual Verification
- **AgentOS:** Send message to Insta test account -> Verify in DB.
- **Payments:** Create test subscription in Razorpay -> Verify webhook.
- **Analytics:** Check dashboard API responses against seed data.
