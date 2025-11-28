const axios = require('axios');

class KlickTippService {
    constructor() {
        this.baseURL = process.env.KLICKTIPP_API_BASE || 'https://api.klicktipp.com/';
        this.username = process.env.KLICKTIPP_USERNAME;
        this.password = process.env.KLICKTIPP_PASSWORD;
        this.sessionId = null;
        this.sessionExpiry = null;
    }

    /**
     * Login and get session ID
     */
    async login() {
        try {
            const response = await axios.post(`${this.baseURL}account/login`, {
                username: this.username,
                password: this.password
            });

            this.sessionId = response.data.session_id;
            this.sessionExpiry = Date.now() + (55 * 60 * 1000); // 55 minutes

            return this.sessionId;
        } catch (error) {
            console.error('KlickTipp login failed:', error.message);
            throw new Error(`KlickTipp authentication failed: ${error.message}`);
        }
    }

    /**
     * Ensure valid session
     */
    async ensureSession() {
        if (!this.sessionId || Date.now() >= this.sessionExpiry) {
            await this.login();
        }
        return this.sessionId;
    }

    /**
     * Subscribe contact to list
     */
    async subscribe(email, listId, phone = null, customFields = {}) {
        await this.ensureSession();

        try {
            const data = {
                session_id: this.sessionId,
                email,
                list_id: listId,
                ...(phone && { sms_number: phone }),
                ...customFields
            };

            const response = await axios.post(
                `${this.baseURL}subscriber/subscribe`,
                data
            );

            return response.data;
        } catch (error) {
            console.error('KlickTipp subscribe failed:', error.message);
            throw new Error(`Failed to subscribe contact: ${error.message}`);
        }
    }

    /**
     * Add tag to subscriber
     */
    async tag(email, tagId) {
        await this.ensureSession();

        try {
            const response = await axios.post(
                `${this.baseURL}subscriber/tag`,
                {
                    session_id: this.sessionId,
                    email,
                    tag_id: tagId
                }
            );

            return response.data;
        } catch (error) {
            console.error('KlickTipp tag failed:', error.message);
            throw new Error(`Failed to tag subscriber: ${error.message}`);
        }
    }

    /**
     * Remove tag from subscriber
     */
    async untag(email, tagId) {
        await this.ensureSession();

        try {
            const response = await axios.post(
                `${this.baseURL}subscriber/untag`,
                {
                    session_id: this.sessionId,
                    email,
                    tag_id: tagId
                }
            );

            return response.data;
        } catch (error) {
            console.error('KlickTipp untag failed:', error.message);
            throw new Error(`Failed to untag subscriber: ${error.message}`);
        }
    }

    /**
     * Format phone number (00XX → +XX)
     */
    formatPhoneNumber(phone) {
        if (phone.startsWith('00')) {
            return '+' + phone.substring(2);
        }
        return phone;
    }
}

module.exports = new KlickTippService();
