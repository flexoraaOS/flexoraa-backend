// Twilio Voice Service (STUB for Phase 1)
// Phase 2: Real Twilio integration with consent checking
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
    }

    /**
     * Make outbound call for phone verification
     * CRITICAL: Must check consent_log before calling
     */
    async makeCall(toNumber, leadId) {
        // Check consent status
        const hasConsent = await this.checkConsent(toNumber);
        if (!hasConsent) {
            logger.warn({ toNumber }, 'Cannot call: no voice consent in consent_log');
            throw new Error('Voice calling not permitted - no consent on record');
        }

        if (!this.enabled) {
            logger.info({ toNumber, leadId }, 'Twilio call (stub)');
            return {
                success: true,
                callSid: 'stub_call_' + Date.now(),
                status: 'initiated',
                mode: 'stub',
            };
        }

        // TODO Phase 2: Real Twilio call
        // const client = twilio(this.accountSid, this.authToken);
        // const call = await client.calls.create({
        //   url: this.twimlUrl,
        //   to: toNumber,
        //   from: this.fromNumber,
        // });

        return { success: true, callSid: 'stub_call', mode: 'stub' };
    }

    /**
     * Check if phone number has voice consent
     */
    async checkConsent(phoneNumber) {
        try {
            const result = await db.query(
                `SELECT consent_status FROM get_latest_consent($1, NULL, 'voice_optin')`,
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
        logger.info({ callSid: body.CallSid, status: body.CallStatus }, 'Twilio webhook received');

        return {
            callSid: body.CallSid,
            status: body.CallStatus,
            duration: body.CallDuration,
            from: body.From,
            to: body.To,
        };
    }
}

module.exports = new TwilioService();
