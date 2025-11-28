const axios = require('axios');
const logger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class InstagramService {
    constructor() {
        this.baseUrl = 'https://graph.facebook.com/v18.0';
        this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
        this.pageId = process.env.INSTAGRAM_PAGE_ID; // Linked Facebook Page ID
    }

    /**
     * Send a text message to an Instagram user
     * @param {string} recipientId - Instagram Scoped User ID (IGSID)
     * @param {string} text - Message content
     */
    async sendText(recipientId, text) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/me/messages`,
                {
                    recipient: { id: recipientId },
                    message: { text: text },
                    access_token: this.accessToken
                }
            );
            return response.data;
        } catch (error) {
            logger.error('Instagram Send Text Error', { error: error.response?.data || error.message });
            throw new AppError('Failed to send Instagram message', 500);
        }
    }

    /**
     * Send an image to an Instagram user
     * @param {string} recipientId 
     * @param {string} imageUrl 
     */
    async sendImage(recipientId, imageUrl) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/me/messages`,
                {
                    recipient: { id: recipientId },
                    message: {
                        attachment: {
                            type: 'image',
                            payload: {
                                url: imageUrl,
                                is_reusable: true
                            }
                        }
                    },
                    access_token: this.accessToken
                }
            );
            return response.data;
        } catch (error) {
            logger.error('Instagram Send Image Error', { error: error.response?.data || error.message });
            throw new AppError('Failed to send Instagram image', 500);
        }
    }

    /**
     * Reply to a specific message
     */
    async replyToMessage(recipientId, text, messageId) {
        // Note: Instagram API might not support direct 'reply_to' in all versions same as WhatsApp
        // Standard implementation is sending a new message to the thread
        return this.sendText(recipientId, text);
    }
}

module.exports = new InstagramService();
