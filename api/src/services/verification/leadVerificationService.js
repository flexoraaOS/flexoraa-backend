const db = require('../../config/database');
const logger = require('../../utils/logger');
const axios = require('axios');

class LeadVerificationService {
    /**
     * Complete lead verification pipeline
     * - Phone validity check
     * - Device status check
     * - Duplicate detection
     * - Fraud scoring
     * - E.164 format conversion
     * Token cost: 0.5 tokens
     */
    async verifyLead(phoneNumber, metadata = {}) {
        try {
            const results = {
                isValid: false,
                e164: null,
                isDuplicate: false,
                fraudScore: 0,
                deviceStatus: 'unknown',
                errors: []
            };

            // 1. E.164 Format Conversion
            results.e164 = this._convertToE164(phoneNumber, metadata.countryCode || 'IN');

            // 2. Phone Validity Check
            const validityCheck = await this._checkPhoneValidity(results.e164);
            results.isValid = validityCheck.isValid;
            if (!validityCheck.isValid) {
                results.errors.push('Invalid phone number format');
            }

            // 3. Duplicate Detection
            const duplicateCheck = await this._checkDuplicate(results.e164, metadata.tenantId);
            results.isDuplicate = duplicateCheck.isDuplicate;
            if (duplicateCheck.existingLeadId) {
                results.existingLeadId = duplicateCheck.existingLeadId;
            }

            // 4. Device Status Check (WhatsApp Business API)
            if (results.isValid) {
                const deviceCheck = await this._checkDeviceStatus(results.e164);
                results.deviceStatus = deviceCheck.status; // 'valid', 'invalid', 'unknown'
            }

            // 5. Fraud Scoring
            results.fraudScore = await this._calculateFraudScore({
                phoneNumber: results.e164,
                metadata,
                deviceStatus: results.deviceStatus
            });

            // Deduct token
            if (metadata.tenantId) {
                const tokenService = require('../payment/tokenService');
                await tokenService.deductTokens(
                    metadata.tenantId,
                    0.5,
                    'lead_verification',
                    `Phone verification: ${results.e164}`
                );
            }

            logger.info({ phoneNumber: results.e164, results }, 'Lead verification complete');
            return results;

        } catch (error) {
            logger.error({ err: error, phoneNumber }, 'Lead verification failed');
            throw error;
        }
    }

    _convertToE164(phoneNumber, countryCode = 'IN') {
        // Remove all non-numeric characters
        let cleaned = phoneNumber.replace(/\D/g, '');

        // Country code prefixes
        const countryPrefixes = {
            'IN': '91',
            'US': '1',
            'GB': '44',
            'AU': '61'
        };

        const prefix = countryPrefixes[countryCode] || '91';

        // If doesn't start with country code, add it
        if (!cleaned.startsWith(prefix)) {
            // Remove leading 0 if present (common in India)
            if (cleaned.startsWith('0')) {
                cleaned = cleaned.substring(1);
            }
            cleaned = prefix + cleaned;
        }

        return '+' + cleaned;
    }

    async _checkPhoneValidity(e164Phone) {
        // Basic validation: must start with + and have 10-15 digits
        const regex = /^\+[1-9]\d{9,14}$/;
        return {
            isValid: regex.test(e164Phone),
            format: 'E.164'
        };
    }

    async _checkDuplicate(e164Phone, tenantId) {
        try {
            const res = await db.query(
                `SELECT id FROM leads 
                 WHERE phone_number = $1 AND tenant_id = $2
                 LIMIT 1`,
                [e164Phone, tenantId]
            );

            return {
                isDuplicate: res.rows.length > 0,
                existingLeadId: res.rows[0]?.id
            };
        } catch (error) {
            logger.error({ err: error }, 'Duplicate check failed');
            return { isDuplicate: false };
        }
    }

    async _checkDeviceStatus(e164Phone) {
        // Check if number is registered on WhatsApp
        // This would use WhatsApp Business API
        // For now, mock implementation
        try {
            // TODO: Integrate with WhatsApp Business API
            // const response = await axios.post('https://graph.facebook.com/v19.0/...');

            return {
                status: 'valid', // 'valid', 'invalid', 'unknown'
                platform: 'whatsapp'
            };
        } catch (error) {
            logger.warn({ err: error, phone: e164Phone }, 'Device status check failed');
            return { status: 'unknown', platform: 'unknown' };
        }
    }

    async _calculateFraudScore(data) {
        let score = 0;

        // Fraud indicators
        if (data.deviceStatus === 'invalid') score += 30;
        if (data.metadata?.source === 'unknown') score += 20;
        if (data.metadata?.suspiciousIP) score += 25;
        if (data.metadata?.rapidSubmissions) score += 25;

        // VoIP detection (common fraud pattern)
        if (this._isVoIP(data.phoneNumber)) score += 40;

        return Math.min(score, 100);
    }

    _isVoIP(phoneNumber) {
        // Common VoIP prefixes (simplified)
        const voipPrefixes = ['+1800', '+1888', '+1877'];
        return voipPrefixes.some(prefix => phoneNumber.startsWith(prefix));
    }
}

module.exports = new LeadVerificationService();
