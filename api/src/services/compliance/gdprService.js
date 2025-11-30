// GDPR Compliance Service
// Handles data deletion requests, anonymization, and audit trails
const db = require('../../config/database');
const logger = require('../../utils/logger');
const crypto = require('crypto');

class GDPRService {
    /**
     * Create data deletion request
     */
    async createDeletionRequest(leadId, requestorEmail, reason = '') {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Verify requestor authority
            const lead = await client.query(
                'SELECT email, phone_number, tenant_id FROM leads WHERE id = $1',
                [leadId]
            );

            if (lead.rows.length === 0) {
                throw new Error('Lead not found');
            }

            const leadData = lead.rows[0];

            // Verify requestor is the lead or has authority
            const isAuthorized = requestorEmail === leadData.email;

            if (!isAuthorized) {
                throw new Error('Unauthorized deletion request');
            }

            // Create deletion request
            const result = await client.query(
                `INSERT INTO gdpr_deletion_requests (
                    lead_id, 
                    requestor_email, 
                    reason, 
                    status, 
                    requested_at
                ) VALUES ($1, $2, $3, 'pending_approval', NOW())
                RETURNING id`,
                [leadId, requestorEmail, reason]
            );

            const requestId = result.rows[0].id;

            // Notify managers for approval
            await this._notifyManagersForApproval(leadData.tenant_id, requestId, leadId);

            await client.query('COMMIT');

            logger.info({ requestId, leadId }, 'GDPR deletion request created');

            return {
                requestId,
                status: 'pending_approval',
                message: 'Deletion request submitted. Awaiting manager approval.'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error({ err: error, leadId }, 'Failed to create deletion request');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Approve deletion request (manager only)
     */
    async approveDeletionRequest(requestId, managerId, notes = '') {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Verify manager role
            const manager = await client.query(
                "SELECT role FROM users WHERE id = $1 AND role IN ('admin', 'manager')",
                [managerId]
            );

            if (manager.rows.length === 0) {
                throw new Error('Unauthorized: Manager role required');
            }

            // Get deletion request
            const request = await client.query(
                'SELECT * FROM gdpr_deletion_requests WHERE id = $1',
                [requestId]
            );

            if (request.rows.length === 0) {
                throw new Error('Deletion request not found');
            }

            const { lead_id, status } = request.rows[0];

            if (status !== 'pending_approval') {
                throw new Error('Request already processed');
            }

            // Update request status
            await client.query(
                `UPDATE gdpr_deletion_requests 
                 SET status = 'approved',
                     approved_by = $1,
                     approved_at = NOW(),
                     approval_notes = $2
                 WHERE id = $3`,
                [managerId, notes, requestId]
            );

            // Execute anonymization
            await this._anonymizeLead(client, lead_id);

            // Update request as completed
            await client.query(
                `UPDATE gdpr_deletion_requests 
                 SET status = 'completed', completed_at = NOW()
                 WHERE id = $1`,
                [requestId]
            );

            await client.query('COMMIT');

            logger.info({ requestId, leadId: lead_id, managerId }, 'GDPR deletion approved and executed');

            return {
                success: true,
                message: 'Lead data anonymized successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error({ err: error, requestId }, 'Deletion approval failed');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Reject deletion request
     */
    async rejectDeletionRequest(requestId, managerId, reason) {
        try {
            await db.query(
                `UPDATE gdpr_deletion_requests 
                 SET status = 'rejected',
                     approved_by = $1,
                     approved_at = NOW(),
                     approval_notes = $2
                 WHERE id = $3`,
                [managerId, reason, requestId]
            );

            logger.info({ requestId, managerId }, 'GDPR deletion rejected');

            return {
                success: true,
                message: 'Deletion request rejected'
            };

        } catch (error) {
            logger.error({ err: error, requestId }, 'Deletion rejection failed');
            throw error;
        }
    }

    /**
     * Anonymize lead data (NOT hard delete)
     */
    async _anonymizeLead(client, leadId) {
        try {
            // Generate anonymized hash
            const anonymousId = crypto.randomBytes(16).toString('hex');

            // Anonymize lead (keep record for deduplication)
            await client.query(
                `UPDATE leads 
                 SET name = 'ANONYMIZED',
                     phone_number = $1,
                     email = NULL,
                     status = 'deleted',
                     metadata = jsonb_build_object(
                         'anonymized', true,
                         'anonymized_at', NOW()::text,
                         'original_id_hash', $1
                     )
                 WHERE id = $2`,
                [anonymousId, leadId]
            );

            // Mask all messages
            await client.query(
                `UPDATE messages 
                 SET body = '[REDACTED]',
                     metadata = metadata || jsonb_build_object('masked', true)
                 WHERE lead_id = $1`,
                [leadId]
            );

            // Anonymize conversation history
            await client.query(
                `UPDATE chat_histories 
                 SET user_message = '[REDACTED]',
                     ai_response = '[REDACTED]'
                 WHERE lead_id = $1`,
                [leadId]
            );

            // Keep audit logs (immutable - never delete)
            // Just mark as anonymized
            await client.query(
                `UPDATE audit_logs 
                 SET metadata = metadata || jsonb_build_object('lead_anonymized', true)
                 WHERE resource_id = $1`,
                [leadId]
            );

            // Create immutable audit log for anonymization
            const auditService = require('./auditService');
            await auditService.logEvent(
                null, // No tenant (system action)
                'SYSTEM',
                'gdpr_anonymization',
                leadId,
                {
                    anonymousId,
                    reason: 'GDPR deletion request',
                    timestamp: new Date().toISOString()
                }
            );

            logger.info({ leadId, anonymousId }, 'Lead data anonymized');

        } catch (error) {
            logger.error({ err: error, leadId }, 'Lead anonymization failed');
            throw error;
        }
    }

    /**
     * Notify managers for approval
     */
    async _notifyManagersForApproval(tenantId, requestId, leadId) {
        try {
            const managers = await db.query(
                `SELECT email FROM users 
                 WHERE tenant_id = $1 AND role IN ('admin', 'manager')`,
                [tenantId]
            );

            const emailService = require('../emailService');

            for (const manager of managers.rows) {
                await emailService.sendEmail({
                    to: manager.email,
                    subject: '⚠️ GDPR Deletion Request - Approval Required',
                    html: `
                        <h2>GDPR Data Deletion Request</h2>
                        <p>A lead has requested data deletion under GDPR.</p>
                        <p><strong>Request ID:</strong> ${requestId}</p>
                        <p><strong>Lead ID:</strong> ${leadId}</p>
                        <p><strong>Action Required:</strong> Review and approve/reject this request.</p>
                        <p><a href="${process.env.FRONTEND_URL}/dashboard/compliance/gdpr/${requestId}">Review Request</a></p>
                        <p><em>Note: Approval will anonymize all lead data while preserving audit logs.</em></p>
                    `
                });
            }

            logger.info({ tenantId, requestId }, 'Managers notified for GDPR approval');

        } catch (error) {
            logger.error({ err: error }, 'Failed to notify managers');
        }
    }

    /**
     * Get deletion requests for tenant
     */
    async getDeletionRequests(tenantId, status = null) {
        try {
            let query = `
                SELECT dr.*, l.name as lead_name, l.email as lead_email
                FROM gdpr_deletion_requests dr
                JOIN leads l ON l.id = dr.lead_id
                WHERE l.tenant_id = $1
            `;

            const params = [tenantId];

            if (status) {
                query += ' AND dr.status = $2';
                params.push(status);
            }

            query += ' ORDER BY dr.requested_at DESC';

            const result = await db.query(query, params);

            return result.rows;

        } catch (error) {
            logger.error({ err: error, tenantId }, 'Failed to get deletion requests');
            throw error;
        }
    }

    /**
     * Export lead data (GDPR data portability)
     */
    async exportLeadData(leadId, requestorEmail) {
        try {
            // Verify requestor
            const lead = await db.query(
                'SELECT * FROM leads WHERE id = $1 AND email = $2',
                [leadId, requestorEmail]
            );

            if (lead.rows.length === 0) {
                throw new Error('Unauthorized or lead not found');
            }

            // Get all related data
            const messages = await db.query(
                'SELECT * FROM messages WHERE lead_id = $1 ORDER BY created_at',
                [leadId]
            );

            const appointments = await db.query(
                'SELECT * FROM appointments WHERE lead_id = $1',
                [leadId]
            );

            const chatHistory = await db.query(
                'SELECT * FROM chat_histories WHERE lead_id = $1 ORDER BY created_at',
                [leadId]
            );

            // Compile export
            const exportData = {
                lead: lead.rows[0],
                messages: messages.rows,
                appointments: appointments.rows,
                chatHistory: chatHistory.rows,
                exportedAt: new Date().toISOString()
            };

            // Log export
            const auditService = require('./auditService');
            await auditService.logEvent(
                lead.rows[0].tenant_id,
                'SYSTEM',
                'gdpr_data_export',
                leadId,
                { requestorEmail }
            );

            logger.info({ leadId, requestorEmail }, 'Lead data exported');

            return exportData;

        } catch (error) {
            logger.error({ err: error, leadId }, 'Data export failed');
            throw error;
        }
    }
}

module.exports = new GDPRService();
