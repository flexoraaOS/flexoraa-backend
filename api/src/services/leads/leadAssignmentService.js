const db = require('../../config/database');
const logger = require('../../utils/logger');
const auditService = require('../audit/auditService');

class LeadAssignmentService {
    /**
     * Assign leads to SDRs
     * PRD: "HOT leads: Instantly routed to available SDR"
     * PRD: "WARM leads: Equally distributed across SDR pool"
     */
    async assignLeads(leadIds, sdrId, tenantId, assignedBy, options = {}) {
        try {
            const results = {
                successful: [],
                failed: [],
                total: leadIds.length
            };

            for (const leadId of leadIds) {
                try {
                    // Check if lead exists and belongs to tenant
                    const lead = await this._getLead(leadId, tenantId);
                    if (!lead) {
                        results.failed.push({
                            leadId,
                            error: 'Lead not found or access denied'
                        });
                        continue;
                    }

                    // Check if SDR exists and is available
                    const sdr = await this._getSDR(sdrId, tenantId);
                    if (!sdr) {
                        results.failed.push({
                            leadId,
                            error: 'SDR not found or unavailable'
                        });
                        continue;
                    }

                    // Assign lead
                    await this._assignLead(leadId, sdrId, assignedBy, options);

                    // Create notification for SDR
                    await this._notifySDR(sdr, lead, options);

                    // Log assignment
                    await auditService.logEvent({
                        tenant_id: tenantId,
                        event_type: 'lead_assigned',
                        entity_type: 'lead',
                        entity_id: leadId,
                        user_id: assignedBy,
                        metadata: {
                            sdr_id: sdrId,
                            lead_score: lead.score,
                            lead_stage: lead.stage,
                            assignment_reason: options.reason || 'manual'
                        }
                    });

                    results.successful.push({
                        leadId,
                        sdrId,
                        sdrName: sdr.name
                    });

                } catch (error) {
                    results.failed.push({
                        leadId,
                        error: error.message
                    });
                    logger.error({ err: error, leadId, sdrId }, 'Failed to assign lead');
                }
            }

            logger.info({ tenantId, results }, 'Lead assignment completed');
            return results;

        } catch (error) {
            logger.error({ err: error, tenantId }, 'Lead assignment failed');
            throw error;
        }
    }

    /**
     * Auto-assign leads based on routing rules
     * PRD: "HOT leads: Instantly routed to available SDR (SLA: 10m response)"
     */
    async autoAssignLead(leadId, tenantId) {
        try {
            const lead = await this._getLead(leadId, tenantId);
            if (!lead) {
                throw new Error('Lead not found');
            }

            // Get available SDRs
            const availableSDRs = await this._getAvailableSDRs(tenantId, lead.stage);

            if (availableSDRs.length === 0) {
                logger.warn({ leadId, tenantId }, 'No available SDRs for assignment');
                return null;
            }

            // Select best SDR based on workload and performance
            const selectedSDR = await this._selectBestSDR(availableSDRs, lead);

            // Assign lead
            await this._assignLead(leadId, selectedSDR.id, 'system', {
                reason: 'auto_routing',
                priority: lead.stage === 'hot' ? 'high' : 'normal'
            });

            // Notify SDR
            await this._notifySDR(selectedSDR, lead, {
                priority: lead.stage === 'hot' ? 'high' : 'normal',
                sla: lead.stage === 'hot' ? '10 minutes' : '24 hours'
            });

            logger.info({ leadId, sdrId: selectedSDR.id, stage: lead.stage }, 'Lead auto-assigned');

            return {
                leadId,
                sdrId: selectedSDR.id,
                sdrName: selectedSDR.name,
                assignmentType: 'auto'
            };

        } catch (error) {
            logger.error({ err: error, leadId, tenantId }, 'Auto-assignment failed');
            throw error;
        }
    }

    /**
     * Reassign lead to different SDR
     */
    async reassignLead(leadId, newSdrId, tenantId, reassignedBy, reason) {
        try {
            const lead = await this._getLead(leadId, tenantId);
            const oldSdrId = lead.assigned_to;

            // Assign to new SDR
            await this._assignLead(leadId, newSdrId, reassignedBy, {
                reason: `reassignment: ${reason}`,
                previous_sdr: oldSdrId
            });

            // Log reassignment
            await auditService.logEvent({
                tenant_id: tenantId,
                event_type: 'lead_reassigned',
                entity_type: 'lead',
                entity_id: leadId,
                user_id: reassignedBy,
                metadata: {
                    old_sdr_id: oldSdrId,
                    new_sdr_id: newSdrId,
                    reason
                }
            });

            logger.info({ leadId, oldSdrId, newSdrId, reason }, 'Lead reassigned');

            return {
                leadId,
                oldSdrId,
                newSdrId,
                reason
            };

        } catch (error) {
            logger.error({ err: error, leadId, tenantId }, 'Reassignment failed');
            throw error;
        }
    }

    /**
     * Get SDR workload
     */
    async getSDRWorkload(sdrId, tenantId) {
        const res = await db.query(
            `SELECT 
                COUNT(*) FILTER (WHERE stage = 'hot') as hot_leads,
                COUNT(*) FILTER (WHERE stage = 'warm') as warm_leads,
                COUNT(*) FILTER (WHERE stage = 'cold') as cold_leads,
                COUNT(*) as total_leads,
                AVG(score) as avg_score
             FROM leads
             WHERE assigned_to = $1 AND tenant_id = $2 AND status != 'closed'`,
            [sdrId, tenantId]
        );

        return res.rows[0];
    }

    async _getLead(leadId, tenantId) {
        const res = await db.query(
            `SELECT * FROM leads WHERE id = $1 AND tenant_id = $2`,
            [leadId, tenantId]
        );
        return res.rows[0];
    }

    async _getSDR(sdrId, tenantId) {
        const res = await db.query(
            `SELECT u.*, um.role 
             FROM users u
             JOIN user_metadata um ON u.id = um.user_id
             WHERE u.id = $1 AND um.tenant_id = $2 AND um.role = 'sdr'`,
            [sdrId, tenantId]
        );
        return res.rows[0];
    }

    async _getAvailableSDRs(tenantId, leadStage) {
        // Get SDRs with their current workload
        const res = await db.query(
            `SELECT 
                u.id, u.name, u.email,
                COUNT(l.id) as current_workload,
                AVG(l.score) as avg_lead_score,
                um.metadata->>'max_leads' as max_leads
             FROM users u
             JOIN user_metadata um ON u.id = um.user_id
             LEFT JOIN leads l ON l.assigned_to = u.id AND l.status != 'closed'
             WHERE um.tenant_id = $1 
               AND um.role = 'sdr'
               AND um.status = 'active'
             GROUP BY u.id, u.name, u.email, um.metadata
             HAVING COUNT(l.id) < COALESCE((um.metadata->>'max_leads')::int, 50)
             ORDER BY COUNT(l.id) ASC`,
            [tenantId]
        );

        return res.rows;
    }

    async _selectBestSDR(availableSDRs, lead) {
        // For HOT leads: Select SDR with lowest workload
        // For WARM/COLD: Round-robin distribution
        if (lead.stage === 'hot') {
            return availableSDRs[0]; // Already sorted by workload ASC
        }

        // Round-robin: Select based on last assignment
        const lastAssignment = await db.query(
            `SELECT assigned_to FROM leads 
             WHERE tenant_id = $1 AND stage = $2
             ORDER BY assigned_at DESC LIMIT 1`,
            [lead.tenant_id, lead.stage]
        );

        if (lastAssignment.rows.length === 0) {
            return availableSDRs[0];
        }

        const lastSdrId = lastAssignment.rows[0].assigned_to;
        const lastIndex = availableSDRs.findIndex(sdr => sdr.id === lastSdrId);
        const nextIndex = (lastIndex + 1) % availableSDRs.length;

        return availableSDRs[nextIndex];
    }

    async _assignLead(leadId, sdrId, assignedBy, options = {}) {
        await db.query(
            `UPDATE leads 
             SET assigned_to = $1, 
                 assigned_by = $2, 
                 assigned_at = NOW(),
                 assignment_metadata = $3,
                 updated_at = NOW()
             WHERE id = $4`,
            [sdrId, assignedBy, JSON.stringify(options), leadId]
        );
    }

    async _notifySDR(sdr, lead, options = {}) {
        // Create notification
        await db.query(
            `INSERT INTO notifications (
                user_id, type, title, message, priority, metadata, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
                sdr.id,
                'lead_assigned',
                `New ${lead.stage?.toUpperCase() || 'LEAD'} assigned to you`,
                `${lead.name} - Score: ${lead.score || 'N/A'}`,
                options.priority || 'normal',
                JSON.stringify({
                    lead_id: lead.id,
                    lead_name: lead.name,
                    lead_score: lead.score,
                    lead_stage: lead.stage,
                    sla: options.sla
                })
            ]
        );

        // TODO: Send email/SMS notification
        logger.info({ sdrId: sdr.id, leadId: lead.id }, 'SDR notified of assignment');
    }
}

module.exports = new LeadAssignmentService();
