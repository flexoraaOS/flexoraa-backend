// KlickTipp Email Marketing Service (STUB for Phase 1) 
// Phase 2: Real KlickTipp API integration
const logger = require('../../utils/logger');
const config = require('../../config/env');

class KlickTippService {
    constructor() {
        this.enabled = config.ENABLE_KLICKTIPP_INTEGRATION;
        this.username = config.KLICKTIPP_USERNAME;
        this.password = config.KLICKTIPP_PASSWORD;
        this.apiBase = config.KLICKTIPP_API_BASE || 'https://api.klicktipp.com/';
    }

    /**
     * Subscribe contact to list (opt-out list)
     */
    async subscribe(email, phoneNumber, listId = 'optout') {
        if (!this.enabled) {
            logger.info({ email, phoneNumber, listId }, 'KlickTipp subscribe (stub)');
            return {
                success: true,
                contactId: 'stub_contact_' + Date.now(),
                mode: 'stub',
            };
        }

        // TODO Phase 2: Real KlickTipp API
        // const response = await axios.post(`${this.apiBase}subscribe`, {
        //   email,
        //   fields: { phone: phoneNumber },
        //   listid: listId,
        // }, {
        //   auth: { username: this.username, password: this.password },
        // });

        return { success: true, contactId: 'stub_contact', mode: 'stub' };
    }

    /**
     * Tag a contact (e.g., 'whatsapp_optout')
     */
    async tagContact(contactId, tagName) {
        if (!this.enabled) {
            logger.info({ contactId, tagName }, 'KlickTipp tag (stub)');
            return { success: true, mode: 'stub' };
        }

        // TODO Phase 2: Real tagging
        return { success: true, mode: 'stub' };
    }

    /**
     * Update custom fields
     */
    async updateFields(contactId, fields) {
        if (!this.enabled) {
            logger.info({ contactId, fields }, 'KlickTipp update fields (stub)');
            return { success: true, mode: 'stub' };
        }

        // TODO Phase 2: Real field updates
        return { success: true, mode: 'stub' };
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload, signature) {
        // TODO Phase 2: Implement signature verification
        if (!this.enabled) {
            return true; // Stub mode
        }
        return true;
    }

    /**
     * Parse outbound webhook
     */
    parseOutboundWebhook(body) {
        return {
            phoneNumber: body.PhoneNumber,
            firstName: body.CustomFieldFirstName,
            customFields: {
                product: body.CustomField217373,
                name: body.CustomField217511,
                linkEnding: body.CustomField218042,
            },
        };
    }
}

module.exports = new KlickTippService();
