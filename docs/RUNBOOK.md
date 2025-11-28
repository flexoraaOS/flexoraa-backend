# Operational Runbook

## 🚨 Incident Response

### High Latency / Timeout
1.  **Check Database:** Ensure Postgres is reachable and connection pool isn't exhausted.
2.  **Check Redis:** Verify Redis is up (used for idempotency/caching).
3.  **Check External APIs:** Status of Gemini, Pinecone, or Meta API.
    *   *Mitigation:* The system has circuit breakers. Check logs for "Circuit Breaker Open".

### AI Service Failure
1.  **Symptoms:** Lead scoring fails or chat bot responds with fallback text.
2.  **Action:** Check `ENABLE_AI_FEATURES` flag.
3.  **Fallback:** System automatically degrades to rule-based scoring and template responses.

### WhatsApp Message Failures
1.  **Check Templates:** Ensure template exists in `templates` table and is approved.
2.  **Check Sandbox:** If in staging, ensure `is_sandbox_approved` is true for the template.
3.  **Check Balance:** Verify Meta/Twilio account balance.

## 🔄 Routine Maintenance

### Database Backups
*   Automated daily via RDS/Supabase.
*   **Manual Backup:** `pg_dump -h <host> -U <user> -d <db> > backup.sql`

### Secret Rotation
1.  Generate new keys.
2.  Update AWS Secrets Manager / `.env`.
3.  Restart service.
4.  **Note:** JWT rotation requires users to re-login.

### Data Seeding (Staging)
To reset staging data:
1.  `npm run migrate:down` (if available) or truncate tables.
2.  `node scripts/seed-staging.js`
3.  `node scripts/seed-vectors.js`

## 📊 Monitoring

### Key Metrics
*   `http_request_duration_seconds`: API Latency.
*   `leads_created_total`: Business throughput.
*   `ai_token_usage`: Cost monitoring.
*   `integration_error_total`: Health of external services.

### Logs
*   Logs are structured JSON.
*   Search for `level: "error"` or `msg: "Circuit breaker open"`.
