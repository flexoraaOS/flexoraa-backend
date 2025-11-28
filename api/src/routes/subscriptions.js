const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const razorpayService = require('../services/payment/razorpayService');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * POST /api/subscriptions
 * Create a new subscription
 */
router.post('/', verifyJWT, asyncHandler(async (req, res) => {
    const { planId } = req.body; // Internal Plan ID

    // 1. Get Plan Details
    const planRes = await db.query('SELECT * FROM plans WHERE id = $1', [planId]);
    const plan = planRes.rows[0];

    if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
    }

    // 2. Create Razorpay Subscription
    const subscription = await razorpayService.createSubscription(plan.razorpay_plan_id);

    // 3. Store in DB (status: incomplete until payment)
    const subRes = await db.query(
        `INSERT INTO subscriptions (
            tenant_id, plan_id, user_id, status, 
            razorpay_subscription_id, current_period_start, current_period_end
        ) VALUES ($1, $2, $3, 'incomplete', $4, NOW(), NOW() + INTERVAL '1 month')
        RETURNING *`,
        [req.user.tenant_id, plan.id, req.user.id, subscription.id]
    );

    res.status(201).json({
        subscriptionId: subRes.rows[0].id,
        razorpaySubscriptionId: subscription.id,
        shortUrl: subscription.short_url // Payment link
    });
}));

/**
 * POST /api/subscriptions/cancel
 * Cancel current subscription
 */
router.post('/cancel', verifyJWT, asyncHandler(async (req, res) => {
    const { subscriptionId } = req.body;

    // 1. Verify ownership
    const subRes = await db.query(
        'SELECT * FROM subscriptions WHERE id = $1 AND tenant_id = $2',
        [subscriptionId, req.user.tenant_id]
    );

    if (!subRes.rows[0]) {
        return res.status(404).json({ error: 'Subscription not found' });
    }

    // 2. Cancel in Razorpay
    await razorpayService.cancelSubscription(subRes.rows[0].razorpay_subscription_id);

    // 3. Update DB
    await db.query(
        "UPDATE subscriptions SET status = 'canceled', canceled_at = NOW() WHERE id = $1",
        [subscriptionId]
    );

    res.json({ success: true, message: 'Subscription canceled' });
}));

/**
 * GET /api/subscriptions/invoices
 * List invoices for tenant
 */
router.get('/invoices', verifyJWT, asyncHandler(async (req, res) => {
    const result = await db.query(
        'SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC',
        [req.user.tenant_id]
    );
    res.json(result.rows);
}));

/**
 * POST /api/subscriptions/webhook
 * Handle Razorpay Webhooks
 */
router.post('/webhook', asyncHandler(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const isValid = razorpayService.verifyWebhookSignature(JSON.stringify(req.body), signature);

    if (!isValid) {
        logger.warn('Invalid Razorpay Webhook Signature');
        return res.status(400).send('Invalid Signature');
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // Log event
    await db.query(
        'INSERT INTO payment_logs (event_type, payload) VALUES ($1, $2)',
        [event, JSON.stringify(payload)]
    );

    // Handle specific events
    if (event === 'subscription.charged') {
        const rzSubId = payload.subscription.entity.id;
        // Update subscription status to active
        await db.query(
            "UPDATE subscriptions SET status = 'active' WHERE razorpay_subscription_id = $1",
            [rzSubId]
        );
    }

    res.json({ status: 'ok' });
}));

module.exports = router;
