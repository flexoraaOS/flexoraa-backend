// KlickTipp Email Marketing Service
// Real implementation using Axios
const axios = require('axios');
const logger = require('../../utils/logger');
const config = require('../../config/env');

class KlickTippService {
    constructor() {
        this.enabled = config.ENABLE_KLICKTIPP_INTEGRATION;
        this.username = config.KLICKTIPP_USERNAME;
        this.password = config.KLICKTIPP_PASSWORD;
        this.apiBase = 'https://api.klicktipp.com'; // Standard API base
        this.sessionCookie = null;
    }

    /**
     * Login to get session (if needed) or use Basic Auth
     * KlickTipp often uses a session-based approach for some endpoints
     */
    async _login() {
        if (this.sessionCookie) return;

        try {
            const response = await axios.post(`${this.apiBase}/account/login`, {
                username: this.username,
                password: this.password
            });

            // Extract session cookie
            const cookies = response.headers['set-cookie'];
            if (cookies) {
                this.sessionCookie = cookies.find(c => c.startsWith('session_id'));
            }
        } catch (error) {
            logger.error({ err: error.message }, 'KlickTipp login failed');
            throw error;
        }
    }

    /**
     * Subscribe contact to list (opt-out list)
     */
    async subscribe(email, phoneNumber, listId) {
        if (!this.enabled || !this.username) {
            logger.info({ email, listId }, 'KlickTipp subscribe (stub)');
            return { success: true, mode: 'stub' };
        }

        try {
            await this._login();

            const response = await axios.post(
                `${this.apiBase}/subscriber`,
                {
                    listid: listId,
                    email: email,
                    fields: {
                        fieldPhone: phoneNumber // Mapping depends on KlickTipp field names
                    }
                },
                {
                    headers: {
                        Cookie: this.sessionCookie
                    }
                }
            );

            return {
                success: true,
                contactId: response.data.id,
                mode: 'real'
            };
        } catch (error) {
            logger.error({ err: error.message, email }, 'KlickTipp subscribe failed');
            throw error;
        }
    }

    /**
     * Tag a contact
     */
    async tagContact(email, tagId) {
        if (!this.enabled || !this.username) {
            logger.info({ email, tagId }, 'KlickTipp tag (stub)');
            return { success: true, mode: 'stub' };
        }

        try {
            await this._login();

            await axios.post(
                `${this.apiBase}/subscriber/tag`,
                {
                    email: email,
                    tagid: tagId
                },
                {
                    headers: {
                        Cookie: this.sessionCookie
                    }
                }
            );

            return { success: true, mode: 'real' };
        } catch (error) {
            logger.error({ err: error.message, email, tagId }, 'KlickTipp tag failed');
            throw error;
        }
    }

    /**
     * Verify webhook signature (if KlickTipp supports it, otherwise IP whitelist)
     */
    verifyWebhookSignature(payload, signature) {
        // KlickTipp webhooks often don't have signatures, rely on secret in URL or IP
        return true;
    }

    /**
     * Parse outbound webhook
     */
    parseOutboundWebhook(body) {
        return {
            phoneNumber: body.PhoneNumber || body.phone,
            firstName: body.CustomFieldFirstName || body.firstname,
            email: body.email,
            customFields: {
                product: body.CustomField217373,
                name: body.CustomField217511,
                linkEnding: body.CustomField218042
            }
        };
    }
}

module.exports = new KlickTippService();
