const db = require('../../config/database');
const logger = require('../../utils/logger');
const csv = require('csv-parser');
const { Readable } = require('stream');
const leadVerificationService = require('../verification/leadVerificationService');
const tokenService = require('../payment/tokenService');

class CSVImportService {
    /**
     * Import leads from CSV file
     * PRD: "Sources: WhatsApp inbound, website forms, CRM API, CSV import"
     * Token cost: 0.5 tokens per lead verification
     */
    async importFromCSV(fileBuffer, tenantId, userId, metadata = {}) {
        try {
            const results = {
                total: 0,
                successful: 0,
                failed: 0,
                duplicates: 0,
                errors: [],
                leads: []
            };

            // Parse CSV
            const leads = await this._parseCSV(fileBuffer);
            results.total = leads.length;

            logger.info({ tenantId, total: leads.length }, 'Starting CSV import');

            // Process each lead
            for (const leadData of leads) {
                try {
                    // Validate required fields
                    if (!leadData.name || !leadData.phone_number) {
                        results.failed++;
                        results.errors.push({
                            row: results.total - leads.length + results.successful + results.failed,
                            error: 'Missing required fields (name, phone_number)'
                        });
                        continue;
                    }

                    // Verify lead
                    const verification = await leadVerificationService.verifyLead(
                        leadData.phone_number,
                        { tenantId, countryCode: leadData.country_code || 'IN' }
                    );

                    // Check for duplicates
                    if (verification.isDuplicate) {
                        results.duplicates++;
                        continue;
                    }

                    // Create lead
                    const lead = await this._createLead({
                        ...leadData,
                        tenant_id: tenantId,
                        created_by: userId,
                        phone_number: verification.e164,
                        verification_status: verification.isValid ? 'verified' : 'failed',
                        fraud_score: verification.fraudScore,
                        device_status: verification.deviceStatus,
                        source: 'csv_import',
                        metadata: {
                            ...metadata,
                            import_date: new Date().toISOString(),
                            original_phone: leadData.phone_number
                        }
                    });

                    results.successful++;
                    results.leads.push(lead);

                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        row: results.total - leads.length + results.successful + results.failed,
                        error: error.message
                    });
                    logger.error({ err: error, leadData }, 'Failed to import lead');
                }
            }

            // Log import summary
            await this._logImport(tenantId, userId, results);

            logger.info({ tenantId, results }, 'CSV import completed');
            return results;

        } catch (error) {
            logger.error({ err: error, tenantId }, 'CSV import failed');
            throw error;
        }
    }

    async _parseCSV(fileBuffer) {
        return new Promise((resolve, reject) => {
            const leads = [];
            const stream = Readable.from(fileBuffer);

            stream
                .pipe(csv())
                .on('data', (row) => {
                    leads.push({
                        name: row.name || row.Name || row.NAME,
                        phone_number: row.phone_number || row.phone || row.Phone || row.PHONE,
                        email: row.email || row.Email || row.EMAIL,
                        company: row.company || row.Company || row.COMPANY,
                        country_code: row.country_code || row.country || 'IN',
                        notes: row.notes || row.Notes || '',
                        tags: row.tags ? row.tags.split(',').map(t => t.trim()) : []
                    });
                })
                .on('end', () => resolve(leads))
                .on('error', (error) => reject(error));
        });
    }

    async _createLead(leadData) {
        const res = await db.query(
            `INSERT INTO leads (
                tenant_id, created_by, name, phone_number, email, company,
                verification_status, fraud_score, device_status, source, metadata,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
            RETURNING *`,
            [
                leadData.tenant_id,
                leadData.created_by,
                leadData.name,
                leadData.phone_number,
                leadData.email,
                leadData.company,
                leadData.verification_status,
                leadData.fraud_score,
                leadData.device_status,
                leadData.source,
                JSON.stringify(leadData.metadata)
            ]
        );

        return res.rows[0];
    }

    async _logImport(tenantId, userId, results) {
        await db.query(
            `INSERT INTO import_logs (
                tenant_id, user_id, total, successful, failed, duplicates, 
                errors, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [
                tenantId,
                userId,
                results.total,
                results.successful,
                results.failed,
                results.duplicates,
                JSON.stringify(results.errors)
            ]
        );
    }

    /**
     * Get import history
     */
    async getImportHistory(tenantId, limit = 50) {
        const res = await db.query(
            `SELECT * FROM import_logs 
             WHERE tenant_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [tenantId, limit]
        );

        return res.rows;
    }
}

module.exports = new CSVImportService();
