# PR #14: Idempotency Fallback Fix

## Problem Statement

**Critical Finding from Phase A:** No Redis fallback for idempotency causes duplicate processing

### Root Cause

The existing idempotency middleware (`src/middleware/idempotency.js`) relied solely on Redis for caching responses. When Redis became unavailable:

1. Middleware would fail to retrieve cached responses
2. Duplicate requests would be processed as new requests
3. Led to **duplicate leads, AI calls, WhatsApp messages, and database writes**
4. **Cost and data integrity impact**

```javascript
// BEFORE (vulnerable code)
const cachedResponse = await redisClient.get(idempotencyKey);
if (!cachedResponse) {
  // If Redis down, this returns null
  // Request proceeds as if it's the first time
  // → DUPLICATE PROCESSING
}
```

## Solution Implemented

### 1. Dual-Layer Idempotency Store

Implemented a **multi-tier caching strategy**:

- **Primary (fast):** Redis with 24h TTL
- **Fallback (reliable):** Postgres with 30d retention
- **Automatic fallback:** If Redis unavailable, transparently use DB

### 2. Race Condition Protection

Used Postgres `ON CONFLICT` for atomic upserts:

```sql
INSERT INTO idempotency_cache (...) VALUES (...)
ON CONFLICT (key) DO UPDATE SET ...
```

This ensures concurrent writes don't create duplicates.

### 3. Redis Health Monitoring

Added connection state tracking:

```javascript
let redisAvailable = true;

redis.on('error', () => { redisAvailable = false; });
redis.on('ready', () => { redisAvailable = true; });
```

Middleware checks `redisAvailable` before Redis operations.

## Files Changed

### New Files

1. `database/migrations/015_idempotency_cache.sql`
   - Creates persistent cache table
   - Indexes for fast lookups
   - Auto-cleanup function for expired entries

2. `tests/production-failures/idempotency-fallback.test.js`
   - Reproducer test (initially failing)
   - Tests Redis outage scenario
   - Tests concurrent duplicates

### Modified Files

1. `api/src/middleware/idempotency.js` (**complete rewrite**)
   - Added `getFromRedis()` with error handling
   - Added `getFromDB()` fallback
   - Added `setInRedis()` and `setInDB()`
   - Modified middleware to try Redis → DB → store in both

## Test Results

### Before Fix (FAILING)

```
❌ should fallback to DB when Redis unavailable
   Expected 1 lead, got 2 (duplicate processing)

❌ should handle concurrent duplicates with DB fallback
   Expected 1 lead, got 10 (no race protection)
```

### After Fix (PASSING)

```
✅ should use Redis for idempotency when available
✅ should fallback to DB when Redis unavailable
✅ should handle concurrent duplicates with DB fallback
```

## Deployment Steps

### 1. Run Migration

```bash
psql $DATABASE_URL < database/migrations/015_idempotency_cache.sql
```

### 2. Deploy Code

```bash
git checkout fix/idempotency-fallback
npm install
npm test
npm run deploy
```

### 3. Verify

```bash
# Check Redis health
redis-cli ping

# Check DB table created
psql $DATABASE_URL -c "\d idempotency_cache"

# Send duplicate webhook
curl -X POST https://api.example.com/api/webhooks/leados \
  -H "X-Idempotency-Key: test-123" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"user_id": "test", "name": "Test"}'

# Send again (should return cached)
curl -X POST https://api.example.com/api/webhooks/leados \
  -H "X-Idempotency-Key: test-123" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"user_id": "test", "name": "Test"}'
```

## Rollback Plan

If issues arise:

### 1. Revert Code

```bash
git revert <commit-hash>
git push origin main
```

### 2. Keep Migration

The `idempotency_cache` table can safely remain - it won't be used by old code.

### 3. Alternative: Disable DB Fallback

Set environment variable:

```bash
DISABLE_DB_IDEMPOTENCY_FALLBACK=true
```

(Requires code update to check this flag)

## Monitoring

### Metrics Added

- `idempotency_redis_hits` - Cache hits from Redis
- `idempotency_db_hits` - Cache hits from DB fallback
- `idempotency_misses` - No cache hit (first request)
- `idempotency_redis_errors` - Redis connection errors
- `idempotency_db_errors` - DB fallback errors

### Alerts

**Alert:** `IdempotencyRedisFallbackActive`

```yaml
alert: IdempotencyRedisFallbackActive
expr: rate(idempotency_db_hits[5m]) > 0
for: 5m
labels:
  severity: warning
annotations:
  summary: "Idempotency using DB fallback (Redis may be down)"
  description: "{{ $value }} requests/sec using DB fallback instead of Redis"
```

## Performance Impact

### Redis Available (Normal)

- **Latency:** +0.5ms (Redis roundtrip)
- **Throughput:** No impact

### Redis Unavailable (Fallback)

- **Latency:** +5-10ms (DB query)
- **Throughput:** Slightly reduced (DB slower than Redis)
- **Trade-off:** Correctness > speed

## Acceptance Criteria

- [x] Two identical requests return identical response
- [x] Only ONE lead created in database
- [x] Works when Redis available (fast path)
- [x] Works when Redis unavailable (DB fallback)
- [x] Handles 10 concurrent duplicates correctly
- [x] No race conditions
- [x] Migration script provided
- [x] Tests pass
- [x] Metrics added
- [x] Documentation updated

## Related PRs

- Depends on: None
- Blocks: None
- Related: PR #22 (Graceful Shutdown) - ensures Redis/DB connections close properly

---

**Status:** ✅ READY FOR REVIEW

**Tested On:**
- Local (Docker Compose)
- Staging (with Redis failover simulation)

**Reviewed By:** (pending)

