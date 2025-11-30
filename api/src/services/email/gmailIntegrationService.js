// Gmail Integration Service for Omnichannel Inbox
// Implements 15-minute polling as per PRD (P2 priority)
const { google } = require('googleapis');
const db = require('../../config/database');
const logger = require('../../utils/logger');
const cron = require('node-cron');

class GmailIntegrationService {
    constructor() {
        this.oauth2Client = null;
        this.gmail = null;
    }

    /**
     * Initialize Gmail API with OAuth2
     */
    async initialize(tenantId) {
        try {
            // Get tenant's Gmail credentials
            const credRes = await db.query(
                `SELECT oauth_credentials 
                 FROM integration_credentials 
                 WHERE tenant_id = $1 AND provider = 'gmail' AND status = 'active'`,
                [tenantId]
            );

            if (credRes.rows.length === 0) {
                logger.warn({ tenantId }, 'Gmail credentials not found');
                return false;
            }

            const credentials = credRes.rows[0].oauth_credentials;

            this.oauth2Client = new google.auth.OAuth2(
                process.env.GMAIL_CLIENT_ID,
                process.env.GMAIL_CLIENT_SECRET,
                process.env.GMAIL_REDIRECT_URI
            );

            this.oauth2Client.setCredentials({
                access_token: credentials.access_token,
                refresh_token: credentials.refresh_token,
                expiry_date: credentials.expiry_date
            });

            this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

            logger.info({ tenantId }, 'Gmail API initialized');
            return true;

        } catch (error) {
            logger.error({ err: error, tenantId }, 'Gmail initialization failed');
            return false;
        }
    }

    /**
     * Start 15-minute polling for all active tenants
     */
    startPolling() {
        // Run every 15 minutes
        cron.schedule('*/15 * * * *', async () => {
            await this.pollAllTenants();
        });

        logger.info('Gmail polling started (every 15 minutes)');
    }

    /**
     * Poll Gmail for all tenants with active integration
     */
    async pollAllTenants() {
        try {
            const tenantsRes = await db.query(
                `SELECT DISTINCT tenant_id 
                 FROM integration_credentials 
                 WHERE provider = 'gmail' AND status = 'active'`
            );

            logger.info({ count: tenantsRes.rows.length }, 'Polling Gmail for tenants');

            for (const { tenant_id } of tenantsRes.rows) {
                try {
                    await this.pollTenantEmails(tenant_id);
                } catch (error) {
                    logger.error({ err: error, tenantId: tenant_id }, 'Tenant Gmail poll failed');
                }
            }

        } catch (error) {
            logger.error({ err: error }, 'Gmail polling failed');
        }
    }

    /**
     * Poll emails for a specific tenant
     */
    async pollTenantEmails(tenantId) {
        try {
            await this.initialize(tenantId);

            if (!this.gmail) {
                return;
            }

            // Get last poll timestamp
            const lastPollRes = await db.query(
                `SELECT last_poll_at 
                 FROM gmail_poll_state 
                 WHERE tenant_id = $1`,
                [tenantId]
            );

            const lastPollAt = lastPollRes.rows[0]?.last_poll_at || new Date(Date.now() - 24 * 60 * 60 * 1000);

            // Query for new messages
            const query = `after:${Math.floor(lastPollAt.getTime() / 1000)} in:inbox`;

            const response = await this.gmail.users.messages.list({
                userId: 'me',
                q: query,
                maxResults: 50
            });

            const messages = response.data.messages || [];

            logger.info({ tenantId, count: messages.length }, 'New Gmail messages found');

            for (const message of messages) {
                await this.processMessage(tenantId, message.id);
            }

            // Update last poll timestamp
            await db.query(
                `INSERT INTO gmail_poll_state (tenant_id, last_poll_at)
                 VALUES ($1, NOW())
                 ON CONFLICT (tenant_id) DO UPDATE SET last_poll_at = NOW()`,
                [tenantId]
            );

        } catch (error) {
            logger.error({ err: error, tenantId }, 'Tenant email polling failed');
        }
    }

    /**
     * Process individual Gmail message
     */
    async processMessage(tenantId, messageId) {
        try {
            const message = await this.gmail.users.messages.get({
                userId: 'me',
                id: messageId,
                format: 'full'
            });

            const headers = message.data.payload.headers;
            const from = headers.find(h => h.name === 'From')?.value;
            const subject = headers.find(h => h.name === 'Subject')?.value;
            const date = headers.find(h => h.name === 'Date')?.value;

            // Extract email body
            const body = this._extractBody(message.data.payload);

            // Extract sender email
            const emailMatch = from.match(/<(.+?)>/);
            const senderEmail = emailMatch ? emailMatch[1] : from;

            // Process via unified inbox
            const unifiedInboxService = require('../unifiedInboxService');
            
            await unifiedInboxService.processIncomingMessage({
                channel: 'gmail',
                externalId: senderEmail,
                tenantId,
                content: {
                    body,
                    subject,
                    messageId,
                    timestamp: new Date(date).toISOString()
                },
                metadata: {
                    from,
                    gmail_message_id: messageId
                }
            });

            logger.info({ tenantId, messageId, from: senderEmail }, 'Gmail message processed');

        } catch (error) {
            logger.error({ err: error, tenantId, messageId }, 'Message processing failed');
        }
    }

    /**
     * Send email reply via Gmail
     */
    async sendReply(tenantId, to, subject, body, inReplyTo = null) {
        try {
            await this.initialize(tenantId);

            if (!this.gmail) {
                throw new Error('Gmail not initialized');
            }

            const email = [
                `To: ${to}`,
                `Subject: ${subject}`,
                inReplyTo ? `In-Reply-To: ${inReplyTo}` : '',
                'Content-Type: text/html; charset=utf-8',
                '',
                body
            ].filter(Boolean).join('\n');

            const encodedEmail = Buffer.from(email)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const response = await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedEmail
                }
            });

            logger.info({ tenantId, to, messageId: response.data.id }, 'Gmail reply sent');

            return {
                success: true,
                messageId: response.data.id
            };

        } catch (error) {
            logger.error({ err: error, tenantId, to }, 'Gmail send failed');
            throw error;
        }
    }

    /**
     * Extract email body from Gmail payload
     */
    _extractBody(payload) {
        let body = '';

        if (payload.body.data) {
            body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
        } else if (payload.parts) {
            for (const part of payload.parts) {
                if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
                    if (part.body.data) {
                        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                        break;
                    }
                }
            }
        }

        // Strip HTML tags for plain text
        return body.replace(/<[^>]*>/g, '').trim();
    }

    /**
     * Get OAuth URL for tenant to connect Gmail
     */
    getAuthUrl(tenantId) {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            process.env.GMAIL_REDIRECT_URI
        );

        const scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send'
        ];

        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            state: tenantId // Pass tenant ID in state
        });
    }

    /**
     * Handle OAuth callback and store credentials
     */
    async handleOAuthCallback(code, tenantId) {
        try {
            const oauth2Client = new google.auth.OAuth2(
                process.env.GMAIL_CLIENT_ID,
                process.env.GMAIL_CLIENT_SECRET,
                process.env.GMAIL_REDIRECT_URI
            );

            const { tokens } = await oauth2Client.getToken(code);

            // Store credentials
            await db.query(
                `INSERT INTO integration_credentials (
                    tenant_id, provider, oauth_credentials, status
                ) VALUES ($1, 'gmail', $2, 'active')
                ON CONFLICT (tenant_id, provider) 
                DO UPDATE SET oauth_credentials = $2, status = 'active', updated_at = NOW()`,
                [tenantId, JSON.stringify(tokens)]
            );

            logger.info({ tenantId }, 'Gmail OAuth credentials stored');

            return { success: true };

        } catch (error) {
            logger.error({ err: error, tenantId }, 'OAuth callback failed');
            throw error;
        }
    }
}

module.exports = new GmailIntegrationService();
