// Twilio Voice Service
// Real implementation using Twilio SDK
const twilio = require('twilio');
const logger = require('../../utils/logger');
const config = require('../../config/env');
const db = require('../../config/database');

class TwilioService {
    constructor() {
        this.enabled = config.ENABLE_TWILIO_CALLING;
        this.accountSid = config.TWILIO_ACCOUNT_SID;
        this.authToken = config.TWILIO_AUTH_TOKEN;
        this.fromNumber = config.TWILIO_FROM_NUMBER;
        this.twimlUrl = config.TWILIO_TWIML_URL;
        this.client = null;

        if (this.enabled && this.accountSid && this.authToken) {
            try {
                this.client = twilio(this.accountSid, this.authToken);
                logger.info('📞 Twilio service initialized');
            } catch (error) {
                logger.error({ err: error }, 'Failed to initialize Twilio client');
            }
        } else {
            logger.warn('Twilio service disabled or missing credentials');
        }
    }

    /**
     * Make outbound call for phone verification
     * CRITICAL: Must check consent_log before calling
     */
    async makeCall(toNumber, leadId) {
        // Check consent status (Fail closed)
        const hasConsent = await this.checkConsent(toNumber);
        if (!hasConsent) {
            logger.warn({ toNumber, leadId }, 'Cannot call: no voice consent in consent_log');
            throw new Error('Voice calling not permitted - no consent on record');
        }

        if (!this.enabled || !this.client) {
            logger.info({ toNumber, leadId }, 'Twilio call (stub)');
            return {
                success: true,
                callSid: 'stub_call_' + Date.now(),
                status: 'initiated',
                mode: 'stub',
            };
        }

        try {
            const call = await this.client.calls.create({
                url: this.twimlUrl,
                to: toNumber,
                from: this.fromNumber,
                statusCallback: `${config.API_URL}/api/webhooks/twilio/status`,
                statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            });

            logger.info({ callSid: call.sid, toNumber }, 'Twilio call initiated');

            return {
                success: true,
                callSid: call.sid,
                status: call.status,
                mode: 'real',
            };
        } catch (error) {
            logger.error({ err: error, toNumber }, 'Twilio call failed');
            throw error;
        }
    }

    /**
     * Check if phone number has voice consent
     */
    async checkConsent(phoneNumber) {
        try {
            // Query consent_log for latest 'voice_optin' status
            const result = await db.query(
                `SELECT consent_status 
         FROM consent_log 
         WHERE phone_number = $1 AND consent_type = 'voice_optin'
         ORDER BY created_at DESC 
         LIMIT 1`,
                [phoneNumber]
            );

            if (result.rows.length === 0) {
                return false; // No consent record
            }

            return result.rows[0].consent_status === 'granted';
        } catch (error) {
            logger.error({ err: error, phoneNumber }, 'Failed to check voice consent');
            return false; // Fail closed
        }
    }

    /**
     * Handle Twilio webhook (call status)
     */
    handleWebhook(body) {
        logger.info({
            callSid: body.CallSid,
            status: body.CallStatus,
            duration: body.CallDuration
        }, 'Twilio call status update');

        return {
            callSid: body.CallSid,
            status: body.CallStatus,
            duration: body.CallDuration,
            from: body.From,
            to: body.To,
        };
    }

    /**
     * Verify webhook signature
     */
    verifySignature(url, params, signature) {
        if (!this.authToken) return false;
        return twilio.validateRequest(this.authToken, signature, url, params);
    }
}

module.exports = new TwilioService();
