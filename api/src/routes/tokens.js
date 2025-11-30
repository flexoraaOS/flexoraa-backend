// Token Management Routes
const express = require('express');
const router = express.Router();
const tokenService = require('../services/payment/tokenService');
const razorpayService = require('../services/payment/razorpayService');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/tokens/balance
 * Get current token balance
 */
router.get('/balance', authenticate, async (req, res, next) => {
    try {
        const balance = await tokenService.getBalance(req.user.tenant_id);
        res.json(balance);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/tokens/usage
 * Get token usage statistics
 */
router.get('/usage', authenticate, async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const stats = await tokenService.getUsageStats(req.user.tenant_id, days);
        res.json(stats);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/tokens/topup/create-order
 * Create Razorpay order for token top-up
 */
router.post('/topup/create-order', authenticate, async (req, res, next) => {
    try {
        const { tokenPack } = req.body;

        if (!tokenPack) {
            throw new AppError('Token pack size required', 400);
        }

        const order = await razorpayService.createTokenOrder(
            req.user.tenant_id,
            tokenPack
        );

        res.json(order);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/tokens/topup/verify
 * Verify payment and credit tokens
 */
router.post('/topup/verify', authenticate, async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw new AppError('Missing payment verification data', 400);
        }

        const result = await razorpayService.processPaymentSuccess(
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature
        );

        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/tokens/payment-history
 * Get payment history
 */
router.get('/payment-history', authenticate, async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const history = await razorpayService.getPaymentHistory(req.user.tenant_id, limit);
        res.json(history);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
