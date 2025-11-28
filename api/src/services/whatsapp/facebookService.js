const axios = require('axios');
const logger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class FacebookService {
    constructor() {
        this.baseUrl = 'https://graph.facebook.com/v18.0';
        this.accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
        this.pageId = process.env.FACEBOOK_PAGE_ID;
    }

    /**
     * Send a text message to a Facebook Messenger user
     * @param {string} recipientId - PSID (Page Scoped ID)
     * @param {string} text - Message content
     */
    async sendText(recipientId, text) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/me/messages`,
                {
                    recipient: { id: recipientId },
                    message: { text: text },
                    messaging_type: 'RESPONSE',
                    access_token: this.accessToken
                }
            );
            return response.data;
        } catch (error) {
            logger.error('Facebook Send Text Error', { error: error.response?.data || error.message });
            throw new AppError('Failed to send Facebook message', 500);
        }
    }

    /**
     * Send a generic template (cards)
     */
    async sendGenericTemplate(recipientId, elements) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/me/messages`,
                {
                    recipient: { id: recipientId },
                    message: {
                        attachment: {
                            type: 'template',
                            payload: {
                                template_type: 'generic',
                                elements: elements
                            }
                        }
                    },
                    access_token: this.accessToken
                }
            );
            return response.data;
        } catch (error) {
            logger.error('Facebook Send Template Error', { error: error.response?.data || error.message });
            throw new AppError('Failed to send Facebook template', 500);
        }
    }
}

module.exports = new FacebookService();
