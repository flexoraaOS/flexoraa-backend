// Calendly Integration Service
// Handles appointment scheduling via Calendly API
const axios = require('axios');
const db = require('../../config/database');
const logger = require('../../utils/logger');

class CalendlyIntegrationService {
    constructor() {
        this.apiToken = process.env.CALENDLY_API_TOKEN;
        this.baseUrl = 'https://api.calendly.com';
    }

    /**
     * Get SDR's Calendly scheduling link
     */
    async getSchedulingLink(sdrId) {
        try {
            // Get SDR's Calendly username from database
            const result = await db.query(
                'SELECT calendly_username, calendly_event_type FROM users WHERE id = $1',
                [sdrId]
            );

            if (result.rows.length === 0 || !result.rows[0].calendly_username) {
                logger.warn({ sdrId }, 'SDR Calendly not configured');
                return null;
            }

            const { calendly_username, calendly_event_type } = result.rows[0];
            
            // Default event type or custom
            const eventType = calendly_event_type || '30min';
            
            return `https://calendly.com/${calendly_username}/${eventType}`;

        } catch (error) {
            logger.error({ err: error, sdrId }, 'Failed to get Calendly link');
            return null;
        }
    }

    /**
     * Create invitee (schedule appointment) via Calendly API
     */
    async createInvitee(eventTypeUri, inviteeData) {
        try {
            if (!this.apiToken) {
                logger.warn('Calendly API token not configured');
                return null;
            }

            const response = await axios.post(
                `${this.baseUrl}/scheduled_events`,
                {
                    event_type: eventTypeUri,
                    invitee: {
                        email: inviteeData.email,
                        name: inviteeData.name,
                        text_reminder_number: inviteeData.phone
                    },
                    start_time: inviteeData.startTime,
                    timezone: inviteeData.timezone || 'Asia/Kolkata'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            logger.info({ 
                eventUri: response.data.resource.uri,
                invitee: inviteeData.email 
            }, 'Calendly appointment created');

            return {
                eventUri: response.data.resource.uri,
                scheduledAt: response.data.resource.start_time,
                joinUrl: response.data.resource.location?.join_url
            };

        } catch (error) {
            logger.error({ err: error.response?.data || error.message }, 'Calendly API error');
            return null;
        }
    }

    /**
     * Get user's event types
     */
    async getUserEventTypes(calendlyUsername) {
        try {
            if (!this.apiToken) {
                return [];
            }

            // First get user URI
            const userResponse = await axios.get(
                `${this.baseUrl}/users/me`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiToken}`
                    }
                }
            );

            const userUri = userResponse.data.resource.uri;

            // Get event types
            const eventTypesResponse = await axios.get(
                `${this.baseUrl}/event_types`,
                {
                    params: { user: userUri },
                    headers: {
                        'Authorization': `Bearer ${this.apiToken}`
                    }
                }
            );

            return eventTypesResponse.data.collection.map(et => ({
                name: et.name,
                uri: et.uri,
                duration: et.duration,
                schedulingUrl: et.scheduling_url
            }));

        } catch (error) {
            logger.error({ err: error.response?.data || error.message }, 'Failed to get event types');
            return [];
        }
    }

    /**
     * Cancel Calendly event
     */
    async cancelEvent(eventUri, reason = 'Cancelled by system') {
        try {
            if (!this.apiToken) {
                logger.warn('Calendly API token not configured');
                return false;
            }

            await axios.post(
                `${this.baseUrl}/scheduled_events/${eventUri}/cancellation`,
                {
                    reason: reason
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            logger.info({ eventUri }, 'Calendly event cancelled');
            return true;

        } catch (error) {
            logger.error({ err: error.response?.data || error.message }, 'Failed to cancel event');
            return false;
        }
    }

    /**
     * Handle Calendly webhook (invitee created, cancelled, etc.)
     */
    async handleWebhook(payload) {
        try {
            const { event, payload: eventPayload } = payload;

            switch (event) {
                case 'invitee.created':
                    await this._handleInviteeCreated(eventPayload);
                    break;
                
                case 'invitee.canceled':
                    await this._handleInviteeCanceled(eventPayload);
                    break;

                default:
                    logger.info({ event }, 'Unhandled Calendly webhook event');
            }

        } catch (error) {
            logger.error({ err: error }, 'Calendly webhook processing failed');
        }
    }

    async _handleInviteeCreated(payload) {
        const { email, name, event: eventData } = payload;
        
        // Find lead by email
        const leadRes = await db.query(
            'SELECT id FROM leads WHERE email = $1',
            [email]
        );

        if (leadRes.rows.length > 0) {
            const leadId = leadRes.rows[0].id;

            // Update lead with appointment info
            await db.query(
                `UPDATE leads 
                 SET has_appointment = true,
                     appointment_scheduled_at = $1,
                     metadata = metadata || jsonb_build_object('calendly_event_uri', $2)
                 WHERE id = $3`,
                [eventData.start_time, eventData.uri, leadId]
            );

            logger.info({ leadId, email }, 'Lead appointment synced from Calendly');
        }
    }

    async _handleInviteeCanceled(payload) {
        const { event: eventData } = payload;

        // Find and update lead
        await db.query(
            `UPDATE leads 
             SET has_appointment = false,
                 appointment_scheduled_at = NULL
             WHERE metadata->>'calendly_event_uri' = $1`,
            [eventData.uri]
        );

        logger.info({ eventUri: eventData.uri }, 'Lead appointment cancelled from Calendly');
    }

    /**
     * Generate personalized Calendly link with prefilled data
     */
    generatePrefillLink(baseUrl, leadData) {
        const params = new URLSearchParams();
        
        if (leadData.name) params.append('name', leadData.name);
        if (leadData.email) params.append('email', leadData.email);
        if (leadData.phone) params.append('a1', leadData.phone); // Custom question answer

        return `${baseUrl}?${params.toString()}`;
    }
}

module.exports = new CalendlyIntegrationService();
