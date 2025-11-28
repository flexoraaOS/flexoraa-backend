const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class RazorpayService {
    constructor() {
        if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
            this.instance = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET
            });
        } else {
            logger.warn('Razorpay credentials missing. Payment features will fail.');
        }
    }

    /**
     * Create a subscription
     * @param {string} planId - Razorpay Plan ID
     * @param {number} totalCount - Number of billing cycles
     */
    async createSubscription(planId, totalCount = 120) {
        try {
            const subscription = await this.instance.subscriptions.create({
                plan_id: planId,
                total_count: totalCount,
                quantity: 1,
                customer_notify: 1
            });
            return subscription;
        } catch (error) {
            logger.error({ err: error }, 'Razorpay Create Subscription Error');
            throw new AppError('Failed to create subscription', 500);
        }
    }

    /**
     * Cancel a subscription
     * @param {string} subscriptionId 
     */
    async cancelSubscription(subscriptionId) {
        try {
            const response = await this.instance.subscriptions.cancel(subscriptionId);
            return response;
        } catch (error) {
            logger.error({ err: error }, 'Razorpay Cancel Subscription Error');
            throw new AppError('Failed to cancel subscription', 500);
        }
    }

    /**
     * Verify webhook signature
     * @param {string} body - Raw request body
     * @param {string} signature - X-Razorpay-Signature header
     */
    verifyWebhookSignature(body, signature) {
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(body)
            .digest('hex');

        return expectedSignature === signature;
    }

    /**
     * Fetch invoice details
     */
    async fetchInvoice(invoiceId) {
        try {
            return await this.instance.invoices.fetch(invoiceId);
        } catch (error) {
            logger.error({ err: error }, 'Razorpay Fetch Invoice Error');
            throw new AppError('Failed to fetch invoice', 500);
        }
    }
}

module.exports = new RazorpayService();
