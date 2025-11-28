# PR-BREAK-FIX-02: Fix Replay Attack & Idempotency Failure

## Summary
The system failed to prevent a Replay Attack where a request with a used `X-Idempotency-Key` but a *modified* body was processed again (or returned a cached 200 OK without detecting the body change). More critically, the destruction test indicated that the controller logic might have been re-executed, violating idempotency principles.

## Root Cause Analysis
The `validateIdempotency` middleware likely checks for the existence of the key in Redis but:
1.  Does not cryptographically bind the key to the request body hash.
2.  May have a race condition where the key is checked but not locked before processing.
3.  The test showed the database was queried again, implying the cache hit logic didn't short-circuit the request processing correctly.

## Remediation Steps
1.  **Bind Key to Body Hash:** Store a hash of the request body alongside the idempotency key in Redis. On cache hit, verify the incoming body hash matches the stored hash. If not, return `409 Conflict` (Idempotency Key Reuse).
2.  **Short-Circuit Processing:** Ensure that if a cache hit occurs, the middleware sends the cached response and *immediately* ends the request, preventing `next()` from being called.

### Code Sketch
```javascript
// src/middleware/idempotency.js
const crypto = require('crypto');

const validateIdempotency = async (req, res, next) => {
    const key = req.headers['x-idempotency-key'];
    if (!key) return next();

    const currentHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
    const cached = await redis.get(`idempotency:${key}`);

    if (cached) {
        const { bodyHash, response } = JSON.parse(cached);
        if (bodyHash !== currentHash) {
            return res.status(409).json({ error: 'Idempotency key reused with different body' });
        }
        return res.status(200).json(response); // Short-circuit
    }

    // ... processing logic
    // Save { bodyHash: currentHash, response: ... } to Redis
};
```

## Validation Tests
Run the following test to verify the fix:
```javascript
// tests/chaos/destruction/state.test.js
test('CRITICAL: Should detect and reject Replay Attack (same key, diff body)', async () => {
    // ... setup ...
    const res = await request(app)
        .post('/api/webhooks/leados')
        .set('X-Idempotency-Key', 'replay-1')
        .send({ user_id: 'u1', name: 'Malicious Change' });

    expect(res.status).not.toBe(500);
    // Expect 409 or 422 if body changed
    if (res.status === 200) {
         // Verify DB was NOT called again
    }
});
```

## Risks
-   **Medium Risk:** Changing idempotency logic can affect clients that retry requests. Ensure the hash comparison is deterministic (canonical JSON stringify).

## Link to Failures
-   File: `tests/chaos/destruction/state.test.js`
-   Log Excerpt:
    ```
    FAIL tests/chaos/destruction/state.test.js
    ● PHASE C: DESTRUCTION - STATE & LOGIC CORRUPTION › CRITICAL: Should detect and reject Replay Attack
      Error: Replay Attack successful: System processed modified payload with used Idempotency Key
    ```
