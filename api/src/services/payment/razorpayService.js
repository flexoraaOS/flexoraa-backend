// Razorpay Payment Service
const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../../config/database');
const logger = require('../../utils/logger');
const tokenService = require('./tokenService');
const { AppError } = require('../../middleware/errorHandler');

class RazorpayService {
    constructor() {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        // Token pack pricing (as per PRD)
        this.tokenPacks = {
            '100': { tokens: 100, price: 5000, discount: 0 }, // ₹50 = $0.50/token
            '500': { tokens: 500, price: 20000, discount: 20 }, // ₹200 = $0.40/token
            '1000': { tokens: 1000, price: 35000, discount: 30 }, // ₹350 = $0.35/token
            '5000': { tokens: 5000, price: 150000, discount: 40 } // ₹1500 = $0.30/token
        };
    }

    /**
     * Create Razorpay order for token top-up
     */
    async createTokenOrder(tenantId, tokenPackSize) {
        try {
            const pack = this.tokenPacks[tokenPackSize];
            if (!pack) {
                throw new AppError('Invalid token pack size', 400);
            }

            // Create Razorpay order
            const order = await this.razorpay.orders.create({
                amount: pack.price, // Amount in paise (₹50 = 5000 paise)
                currency: 'INR',
                receipt: `token_${tenantId}_${Date.now()}`,
                notes: {
                    tenant_id: tenantId,
                    token_pack: tokenPackSize,
                    tokens: pack.tokens
                }
            });

            // Store order in database
            await db.query(
                `INSERT INTO payment_orders (
                    id, tenant_id, order_type, amount, currency, 
                    status, razorpay_order_id, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    crypto.randomUUID(),
                    tenantId,
                    'token_topup',
                    pack.price / 100, // Store in rupees
                    'INR',
                    'created',
                    order.id,
                    JSON.stringify({ token_pack: tokenPackSize, tokens: pack.tokens })
                ]
            );

            logger.info({ tenantId, orderId: order.id, tokens: pack.tokens }, 'Token order created');

            return {
                orderId: order.id,
                amount: pack.price,
                currency: 'INR',
                tokens: pack.tokens,
                discount: pack.discount
            };

        } catch (error) {
            logger.error({ err: error, tenantId }, 'Failed to create token order');
            throw error;
        }
    }

    /**
     * Verify Razorpay payment signature
     */
    verifyPaymentSignature(orderId, paymentId, signature) {
        const body = orderId + '|' + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(signature)
        );
    }

    /**
     * Process successful payment and credit tokens
     */
    async processPaymentSuccess(paymentId, orderId, signature) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Verify signature
            if (!this.verifyPaymentSignature(orderId, paymentId, signature)) {
                throw new AppError('Invalid payment signature', 400);
            }

            // Get order details
            const orderRes = await client.query(
                'SELECT * FROM payment_orders WHERE razorpay_order_id = $1 FOR UPDATE',
                [orderId]
            );

            if (orderRes.rows.length === 0) {
                throw new AppError('Order not found', 404);
            }

            const order = orderRes.rows[0];

            if (order.status === 'completed') {
                logger.warn({ orderId }, 'Payment already processed');
                return { success: true, message: 'Already processed' };
            }

            // Update order status
            await client.query(
                `UPDATE payment_orders 
                 SET status = 'completed', 
                     razorpay_payment_id = $1,
                     completed_at = NOW()
                 WHERE razorpay_order_id = $2`,
                [paymentId, orderId]
            );

            // Credit tokens
            const tokens = order.metadata.tokens;
            await tokenService.topUpTokens(
                order.tenant_id,
                tokens,
                paymentId,
                `Token Pack Purchase: ${tokens} tokens`
            );

            await client.query('COMMIT');

            logger.info({ 
                tenantId: order.tenant_id, 
                paymentId, 
                tokens 
            }, 'Payment processed and tokens credited');

            return {
                success: true,
                tokens,
                tenantId: order.tenant_id
            };

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error({ err: error, paymentId, orderId }, 'Payment processing failed');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Handle payment failure
     */
    async processPaymentFailure(orderId, reason) {
        await db.query(
            `UPDATE payment_orders 
             SET status = 'failed', 
                 metadata = metadata || jsonb_build_object('failure_reason', $2)
             WHERE razorpay_order_id = $1`,
            [orderId, reason]
        );

        logger.warn({ orderId, reason }, 'Payment failed');
    }

    /**
     * Get payment history for tenant
     */
    async getPaymentHistory(tenantId, limit = 50) {
        const result = await db.query(
            `SELECT * FROM payment_orders 
             WHERE tenant_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [tenantId, limit]
        );

        return result.rows;
    }
}

module.exports = new RazorpayService();
