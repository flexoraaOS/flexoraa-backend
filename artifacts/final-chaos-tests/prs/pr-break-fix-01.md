# PR-BREAK-FIX-01: Fix Empty Body Handling in Webhooks

## Summary
The webhook endpoint `/api/webhooks/leados` incorrectly accepts empty JSON bodies with a `200 OK` status, potentially leading to undefined behavior or processing of invalid data. It should reject empty payloads with `400 Bad Request`.

## Root Cause Analysis
The `express.json()` middleware or Joi validation schema allows empty objects or does not strictly enforce required fields at the top level. The current validation logic likely treats an empty object `{}` as valid if all fields are optional or if validation is skipped for empty inputs.

## Remediation Steps
1.  **Update Validation Middleware:** Ensure the Joi schema for the webhook endpoint requires at least one field or explicitly forbids empty objects.
2.  **Strict Body Parsing:** Configure `express.json({ strict: true })` (though this mainly affects arrays/primitives) or add a custom middleware to check `Object.keys(req.body).length`.

### Code Sketch
```javascript
// src/middleware/validation.js
const validateWebhook = (schema) => (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'Payload cannot be empty' });
    }
    // ... existing validation logic
};
```

## Validation Tests
Run the following test to verify the fix:
```javascript
// tests/chaos/destruction/edge-cases.test.js
test('CRITICAL: Should handle empty body', async () => {
    const res = await request(app)
        .post('/api/webhooks/leados')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({});

    expect(res.status).toBe(400);
});
```

## Risks
-   **Low Risk:** Standard API hardening. Ensure legitimate clients are not sending empty keep-alive packets that expect 200 OK (unlikely for a webhook).

## Link to Failures
-   File: `tests/chaos/destruction/edge-cases.test.js`
-   Log Excerpt:
    ```
    FAIL tests/chaos/destruction/edge-cases.test.js
    ● PHASE C: DESTRUCTION - EDGE CASES › CRITICAL: Should handle empty body
      Expected: 400
      Received: 200
    ```
