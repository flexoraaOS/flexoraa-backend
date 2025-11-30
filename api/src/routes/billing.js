const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const razorpayService = require('../services/payment/razorpayService');
const tokenService = require('../services/payment/tokenService');
const db = require('../config/database');
const logger = require('../utils/logger');

// Token Pack Pricing (from PRD v2)
const TOKEN_PACKS = {
    'pack_100': { tokens: 100, amount: 5000 }, // $50 -> ~4200 INR, rounded to 5000 paise (50 INR) for testing? PRD says $50. Let's assume 1 Token = 0.5 USD = ~42 INR.
    // PRD: 100 tokens = $50. 
    // Let's use INR for Razorpay. $1 = 84 INR.
    // 100 tokens = $50 = 4200 INR = 420000 paise.
    'pack_100': { tokens: 100, amount: 420000 },
    'pack_500': { tokens: 500, amount: 1680000 }, // $200 (20% off)
    'pack_1000': { tokens: 1000, amount: 2940000 }, // $350 (30% off)
    'pack_5000': { tokens: 5000, amount: 12600000 } // $1500 (40% off)
};

/**
 * GET /api/billing/balance
 * Get current token balance
 */
router.get('/balance', verifyJWT, asyncHandler(async (req, res) => {
    const balance = await tokenService.getBalance(req.user.tenant_id);
    res.json(balance);
}));

/**
 * POST /api/billing/top-up
 * Create order for token pack
 */
router.post('/top-up', verifyJWT, asyncHandler(async (req, res) => {
    const { packId } = req.body;
    const pack = TOKEN_PACKS[packId];

    if (!pack) {
        return res.status(400).json({ error: 'Invalid token pack' });
    }

    const order = await razorpayService.createOrder(pack.amount, 'INR', {
        tenant_id: req.user.tenant_id,
        pack_id: packId,
        tokens: pack.tokens,
        type: 'token_topup'
    });

    res.json(order);
}));

/**
 * POST /api/billing/webhook
 * Handle Razorpay Webhooks (Payments & Subscriptions)
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

    logger.info({ event }, 'Razorpay Webhook Received');

    // Handle One-Time Payment (Token Top-up)
    if (event === 'payment.captured') {
        const payment = payload.payment.entity;
        const notes = payment.notes;

        if (notes && notes.type === 'token_topup') {
            await tokenService.topUpTokens(
                notes.tenant_id,
                parseInt(notes.tokens),
                payment.id,
                `Top-up: ${notes.pack_id}`
            );
        }
    }
    // Handle Subscription Renewal (Monthly Tokens)
    else if (event === 'subscription.charged') {
        const subscription = payload.subscription.entity;
        const planId = subscription.plan_id;

        // Find tenant from subscription
        const subRes = await db.query(
            'SELECT tenant_id, plan_id FROM subscriptions WHERE razorpay_subscription_id = $1',
            [subscription.id]
        );

        if (subRes.rows[0]) {
            const { tenant_id } = subRes.rows[0];

            // Determine tokens based on plan (simplified map)
            // In prod, fetch from plans table
            let tokens = 0;
            // Example logic:
            // if (plan.name === 'LeadOS Starter') tokens = 250;
            // For now, default to 250
            tokens = 250;

            await tokenService.topUpTokens(
                tenant_id,
                tokens,
                subscription.id,
                'Monthly Subscription Renewal'
            );
        }
    }

    res.json({ status: 'ok' });
}));

module.exports = router;
