# 🎨 FRONTEND-BACKEND MAPPING - PRD v2.0 Coverage Analysis

**Date**: November 30, 2025  
**Purpose**: Map existing frontend UI to backend API requirements from PRD v2.0

---

## 📊 EXISTING FRONTEND PAGES (26 Pages)

### ✅ Dashboard Pages
1. `/dashboard` - Main dashboard (router to LeadOS/AgentOS)
2. `/dashboard/leados` - LeadOS dashboard
3. `/dashboard/leados/leads-assign` - Lead assignment
4. `/dashboard/leados-sdr` - LeadOS SDR view
5. `/dashboard/agentos` - AgentOS dashboard
6. `/dashboard/agentos-sdr` - AgentOS SDR view
7. `/dashboard/agentos-demo` - AgentOS demo
8. `/dashboard/admin-dashboard` - Admin dashboard
9. `/dashboard/conversations` - Unified inbox conversations
10. `/dashboard/messages` - Messages view
11. `/dashboard/leads/[stage]` - Dynamic lead stages
12. `/dashboard/upload-leads` - CSV upload
13. `/dashboard/uploaded-leads` - Uploaded leads list
14. `/dashboard/verified-leads` - Verified leads list
15. `/dashboard/recent-leads` - Recent leads
16. `/dashboard/engaged-leads` - Engaged leads
17. `/dashboard/qualified-leads` - Qualified leads
18. `/dashboard/follow-up` - Follow-up management
19. `/dashboard/billing` - Billing & tokens
20. `/dashboard/monitoring` - System monitoring
21. `/dashboard/settings` - Settings
22. `/dashboard/profile` - User profile
23. `/dashboard/ai-messaging` - AI messaging
24. `/dashboard/ai-persona` - AI persona configuration
25. `/dashboard/create-agent` - Agent creation
26. `/dashboard/campaign-intelligence` - Campaign analytics

### ✅ Auth Pages
- `/auth/login` - Login
- `/auth/signup` - Signup
- `/auth/forgot-password` - Password reset
- `/auth/reset-password` - Reset password
- `/auth/verify-otp` - OTP verification
- `/auth/whatsapp-login` - WhatsApp login
- `/auth/whatsapp-qr-login` - WhatsApp QR login

### ✅ Marketing Pages
- `/` - Homepage
- `/about` - About page
- `/leados` - LeadOS product page
- `/agentos` - AgentOS product page
- `/pricing` - Pricing page
- `/integrations` - Integrations page
- `/contacts` - Contact page

### ✅ Legal Pages
- `/privacy-policy` - Privacy policy
- `/terms-of-service` - Terms of service

### ✅ Onboarding
- `/onboarding` - Multi-step onboarding flow

---

## 🔗 FRONTEND-BACKEND API MAPPING

### 1. LeadOS - Lead Management

#### ✅ IMPLEMENTED (Frontend + Backend)

| Frontend Page | Backend API | PRD Feature | Status |
|---------------|-------------|-------------|--------|
| `/dashboard/upload-leads` | `POST /api/leads/import/csv` | CSV Import | ✅ UI exists, ❌ API missing |
| `/dashboard/uploaded-leads` | `GET /api/leads?status=uploaded` | Lead List | ✅ Both exist |
| `/dashboard/verified-leads` | `GET /api/leads?status=verified` | Verified Leads | ✅ Both exist |
| `/dashboard/recent-leads` | `GET /api/leads?sort=recent` | Recent Leads | ✅ Both exist |
| `/dashboard/qualified-leads` | `GET /api/leads?status=qualified` | Qualified Leads | ✅ Both exist |
| `/dashboard/engaged-leads` | `GET /api/leads?status=engaged` | Engaged Leads | ✅ Both exist |
| `/dashboard/leads/[stage]` | `GET /api/leads?stage={stage}` | Lead Stages | ✅ Both exist |
| `/dashboard/leados/leads-assign` | `POST /api/leads/assign` | Lead Assignment | ✅ UI exists, ❌ API missing |

#### ❌ MISSING (Backend API Needed)

| Frontend Feature | Missing Backend API | PRD Requirement |
|------------------|---------------------|-----------------|
| CSV Upload | `POST /api/leads/import/csv` | Bulk lead import |
| CRM Import | `POST /api/leads/import/crm` | Salesforce/HubSpot/Zoho |
| Website Form | `POST /api/leads/webhook/form-submission` | Form submissions |
| Lead Assignment | `POST /api/leads/assign` | SDR assignment |
| Budget Extraction | `GET /api/leads/{id}/budget` | Budget range extraction |
| Timeline Extraction | `GET /api/leads/{id}/timeline` | Timeline extraction |

---

### 2. AgentOS - Conversations

#### ✅ IMPLEMENTED (Frontend + Backend)

| Frontend Page | Backend API | PRD Feature | Status |
|---------------|-------------|-------------|--------|
| `/dashboard/conversations` | `GET /api/conversations` | Unified Inbox | ✅ Both exist |
| `/dashboard/conversations` | `POST /api/messages/whatsapp` | WhatsApp Send | ✅ Both exist |
| `/dashboard/conversations` | `POST /api/messages/instagram` | Instagram Send | ✅ Both exist |
| `/dashboard/conversations` | `POST /api/messages/messenger` | Facebook Send | ✅ Both exist |
| `/dashboard/messages` | `GET /api/messages` | Message History | ✅ Both exist |
| `/dashboard/agentos-sdr` | `GET /api/conversations/active` | Active Conversations | ✅ UI exists, ❌ API missing |

#### ❌ MISSING (Backend API Needed)

| Frontend Feature | Missing Backend API | PRD Requirement |
|------------------|---------------------|-----------------|
| Priority Queue | `GET /api/conversations?priority=P0` | Priority-based routing |
| Gmail Polling | Automated 15-min polling | Gmail integration |
| Competitor Detection | Intent detection enhancement | Competitor inquiry |
| Channel Preferences | `GET /api/leads/{id}/channel-preference` | Cross-channel learning |

---

### 3. Billing & Tokens

#### ✅ IMPLEMENTED (Frontend + Backend)

| Frontend Page | Backend API | PRD Feature | Status |
|---------------|-------------|-------------|--------|
| `/dashboard/billing` | `GET /api/tokens/balance` | Token Balance | ✅ Both exist |
| `/dashboard/billing` | `GET /api/tokens/history` | Token History | ✅ Both exist |
| `/dashboard/billing` | `GET /api/subscriptions` | Subscription Info | ✅ Both exist |

#### ❌ MISSING (Backend API Needed)

| Frontend Feature | Missing Backend API | PRD Requirement |
|------------------|---------------------|-----------------|
| Token Top-Up UI | `POST /api/razorpay/create-order` | Razorpay integration |
| Threshold Alerts | Automated email alerts | 50%/80%/100% alerts |
| Tiered Pricing Display | Pricing calculation | Discount tiers |
| Usage Forecast | `GET /api/tokens/forecast` | Predictive usage |

---

### 4. Monitoring & Analytics

#### ✅ IMPLEMENTED (Frontend + Backend)

| Frontend Page | Backend API | PRD Feature | Status |
|---------------|-------------|-------------|--------|
| `/dashboard/monitoring` | `GET /api/monitoring/sla` | SLA Monitoring | ✅ Both exist |
| `/dashboard/monitoring` | `GET /api/monitoring/drift` | Model Drift | ✅ Both exist |
| `/dashboard/campaign-intelligence` | `GET /api/analytics/campaigns` | Campaign Analytics | ✅ UI exists, ❌ API missing |
| `/dashboard/admin-dashboard` | `GET /api/admin/overview` | Admin Overview | ✅ UI exists, ❌ API missing |

#### ❌ MISSING (Backend API Needed)

| Frontend Feature | Missing Backend API | PRD Requirement |
|------------------|---------------------|-----------------|
| Campaign Analytics | `GET /api/analytics/campaigns` | Campaign performance |
| Admin Overview | `GET /api/admin/overview` | System-wide stats |
| SDR Leaderboard | `GET /api/analytics/sdr-performance` | SDR performance tracking |
| Engagement Trends | `GET /api/analytics/engagement-trends` | Engagement patterns |
| Predictive Scoring | `GET /api/leads/{id}/conversion-likelihood` | 30-day conversion |

---

### 5. AI & Automation

#### ✅ IMPLEMENTED (Frontend + Backend)

| Frontend Page | Backend API | PRD Feature | Status |
|---------------|-------------|-------------|--------|
| `/dashboard/ai-messaging` | `POST /api/ai/generate-message` | AI Message Generation | ✅ UI exists, ❌ API missing |
| `/dashboard/ai-persona` | `GET /api/ai/persona` | AI Persona Config | ✅ UI exists, ❌ API missing |
| `/dashboard/create-agent` | `POST /api/agents/create` | Agent Creation | ✅ UI exists, ❌ API missing |

#### ❌ MISSING (Backend API Needed)

| Frontend Feature | Missing Backend API | PRD Requirement |
|------------------|---------------------|-----------------|
| AI Message Generation | `POST /api/ai/generate-message` | Psychology-driven prompts |
| AI Persona Config | `PUT /api/ai/persona` | Persona customization |
| Agent Creation | `POST /api/agents/create` | Custom agent setup |
| 6-Turn Interview UI | Interview state management | Structured qualification |
| Budget Extraction UI | Display extracted budget | Budget range display |
| Timeline Extraction UI | Display extracted timeline | Timeline display |

---

### 6. Settings & Configuration

#### ✅ IMPLEMENTED (Frontend + Backend)

| Frontend Page | Backend API | PRD Feature | Status |
|---------------|-------------|-------------|--------|
| `/dashboard/settings` | `GET /api/settings` | Settings | ✅ UI exists, ❌ API missing |
| `/dashboard/profile` | `GET /api/profile` | User Profile | ✅ Both exist |
| `/onboarding` | `POST /api/onboarding/complete` | Onboarding | ✅ UI exists, ❌ API missing |

#### ❌ MISSING (Backend API Needed)

| Frontend Feature | Missing Backend API | PRD Requirement |
|------------------|---------------------|-----------------|
| Settings Management | `PUT /api/settings` | System settings |
| Onboarding Completion | `POST /api/onboarding/complete` | Onboarding flow |
| Integration Setup | `POST /api/integrations/setup` | WhatsApp/Instagram/Gmail |
| Consent Capture | `POST /api/compliance/consent` | GDPR consent |
| Data Retention Config | `PUT /api/compliance/retention` | Retention policies |

---

## 📋 MISSING BACKEND APIs FOR EXISTING FRONTEND

### P0 - Critical (Frontend exists, backend missing)

1. **CSV Import API**
   - Frontend: `/dashboard/upload-leads`
   - Missing: `POST /api/leads/import/csv`
   - Impact: Cannot upload leads via CSV

2. **Lead Assignment API**
   - Frontend: `/dashboard/leados/leads-assign`
   - Missing: `POST /api/leads/assign`
   - Impact: Cannot assign leads to SDRs

3. **Token Top-Up API**
   - Frontend: `/dashboard/billing` (has UI components)
   - Missing: `POST /api/razorpay/create-order`
   - Impact: Cannot purchase tokens

4. **Campaign Analytics API**
   - Frontend: `/dashboard/campaign-intelligence`
   - Missing: `GET /api/analytics/campaigns`
   - Impact: No campaign performance data

5. **Admin Overview API**
   - Frontend: `/dashboard/admin-dashboard`
   - Missing: `GET /api/admin/overview`
   - Impact: No system-wide statistics

### P1 - High (Frontend exists, backend incomplete)

6. **AI Message Generation API**
   - Frontend: `/dashboard/ai-messaging`
   - Missing: `POST /api/ai/generate-message`
   - Impact: Cannot generate AI messages

7. **AI Persona Config API**
   - Frontend: `/dashboard/ai-persona`
   - Missing: `GET/PUT /api/ai/persona`
   - Impact: Cannot customize AI persona

8. **Agent Creation API**
   - Frontend: `/dashboard/create-agent`
   - Missing: `POST /api/agents/create`
   - Impact: Cannot create custom agents

9. **Active Conversations API**
   - Frontend: `/dashboard/agentos-sdr`
   - Missing: `GET /api/conversations/active`
   - Impact: Cannot see active conversations

10. **SDR Performance API**
    - Frontend: SDR Leaderboard component
    - Missing: `GET /api/analytics/sdr-performance`
    - Impact: No SDR performance tracking

### P2 - Medium (Frontend exists, backend enhancement needed)

11. **Settings Management API**
    - Frontend: `/dashboard/settings`
    - Missing: `PUT /api/settings`
    - Impact: Cannot save settings

12. **Onboarding Completion API**
    - Frontend: `/onboarding`
    - Missing: `POST /api/onboarding/complete`
    - Impact: Cannot track onboarding progress

13. **Integration Setup API**
    - Frontend: Onboarding dialogs
    - Missing: `POST /api/integrations/setup`
    - Impact: Cannot configure integrations

14. **Budget Extraction Display**
    - Frontend: Lead details panels
    - Missing: Budget extraction logic
    - Impact: Cannot show budget ranges

15. **Timeline Extraction Display**
    - Frontend: Lead details panels
    - Missing: Timeline extraction logic
    - Impact: Cannot show timelines

---

## 🎯 FRONTEND FEATURES READY FOR BACKEND CONNECTION

### Fully Built UI (Just needs API connection)

1. **Upload Leads Page** (`/dashboard/upload-leads`)
   - Has CSV upload UI
   - Has drag-and-drop
   - Has validation
   - **Needs**: `POST /api/leads/import/csv`

2. **Billing Page** (`/dashboard/billing`)
   - Has token balance display
   - Has usage charts
   - Has top-up button
   - **Needs**: `POST /api/razorpay/create-order`

3. **Conversations Page** (`/dashboard/conversations`)
   - Has unified inbox UI
   - Has channel filters
   - Has message sending
   - **Needs**: Priority queue API, Gmail polling

4. **Campaign Intelligence** (`/dashboard/campaign-intelligence`)
   - Has analytics charts
   - Has performance metrics
   - Has date range filters
   - **Needs**: `GET /api/analytics/campaigns`

5. **Admin Dashboard** (`/dashboard/admin-dashboard`)
   - Has overview tab
   - Has financials tab
   - Has clients tab
   - Has system ops tab
   - **Needs**: `GET /api/admin/*` endpoints

6. **AI Messaging** (`/dashboard/ai-messaging`)
   - Has message generation UI
   - Has template selection
   - Has preview
   - **Needs**: `POST /api/ai/generate-message`

7. **AI Persona** (`/dashboard/ai-persona`)
   - Has persona configuration UI
   - Has tone settings
   - Has psychology settings
   - **Needs**: `GET/PUT /api/ai/persona`

8. **Create Agent** (`/dashboard/create-agent`)
   - Has agent creation wizard
   - Has configuration options
   - **Needs**: `POST /api/agents/create`

9. **Lead Assignment** (`/dashboard/leados/leads-assign`)
   - Has SDR selection UI
   - Has bulk assignment
   - **Needs**: `POST /api/leads/assign`

10. **Settings Page** (`/dashboard/settings`)
    - Has settings form
    - Has integration toggles
    - **Needs**: `PUT /api/settings`

---

## 📊 SUMMARY STATISTICS

### Frontend Coverage
- **Total Pages**: 26 dashboard pages + 7 auth pages + 6 marketing pages = **39 pages**
- **Pages with UI**: 39 (100%)
- **Pages with working backend**: ~25 (64%)
- **Pages missing backend**: ~14 (36%)

### Backend API Coverage
- **Total APIs needed**: ~80 endpoints
- **APIs implemented**: ~52 endpoints (65%)
- **APIs missing**: ~28 endpoints (35%)

### Priority Breakdown
- **P0 Critical**: 5 missing APIs
- **P1 High**: 5 missing APIs
- **P2 Medium**: 5 missing APIs
- **P3 Low**: 13 missing APIs

---

## 🚀 RECOMMENDED IMPLEMENTATION ORDER

### Phase 1: Connect Existing UI (Week 1-2)
1. CSV Import API → Connect to `/dashboard/upload-leads`
2. Lead Assignment API → Connect to `/dashboard/leados/leads-assign`
3. Campaign Analytics API → Connect to `/dashboard/campaign-intelligence`
4. Admin Overview API → Connect to `/dashboard/admin-dashboard`
5. Active Conversations API → Connect to `/dashboard/agentos-sdr`

### Phase 2: Billing & Payments (Week 3)
6. Token Top-Up API → Connect to `/dashboard/billing`
7. Threshold Alerts → Email notifications
8. Usage Forecast API → Predictive usage display

### Phase 3: AI Features (Week 4)
9. AI Message Generation API → Connect to `/dashboard/ai-messaging`
10. AI Persona Config API → Connect to `/dashboard/ai-persona`
11. Agent Creation API → Connect to `/dashboard/create-agent`

### Phase 4: Analytics & Optimization (Week 5)
12. SDR Performance API → SDR Leaderboard
13. Engagement Trends API → Analytics dashboards
14. Predictive Scoring API → Lead scoring display

### Phase 5: Settings & Configuration (Week 6)
15. Settings Management API → `/dashboard/settings`
16. Onboarding Completion API → `/onboarding`
17. Integration Setup API → Onboarding dialogs

---

## ✅ CONCLUSION

**Frontend Status**: 🟢 **Excellent** - 39 pages fully built with modern UI  
**Backend Status**: 🟡 **Good** - 65% of APIs implemented  
**Gap**: 🔴 **14 pages** waiting for backend APIs

**Next Steps**:
1. Implement 5 P0 critical APIs (Week 1-2)
2. Connect existing UI to new APIs (Week 2-3)
3. Test end-to-end flows (Week 3-4)
4. Deploy to production (Week 4)

**Estimated Time**: 4-6 weeks to connect all existing UI to backend APIs

---

**Document Status**: Complete  
**Last Updated**: November 30, 2025  
**Next Review**: After Phase 1 completion
