// A/B Testing Framework for Psychology Variants
// Implements PRD Section: Experimentation & A/B Testing
const db = require('../../config/database');
const logger = require('../../utils/logger');
const cron = require('node-cron');

class ABTestingService {
    constructor() {
        // Active experiments cache
        this.activeExperiments = new Map();
    }

    /**
     * Create new A/B test experiment
     */
    async createExperiment(config) {
        try {
            const {
                name,
                description,
                variants,
                targetMetric,
                sampleSize = 1050, // Per PRD: ~1,050 leads per variant
                duration = 14, // Days
                tenantId
            } = config;

            // Validate variants
            if (!variants || variants.length < 2) {
                throw new Error('At least 2 variants required');
            }

            // Ensure control variant exists
            const hasControl = variants.some(v => v.isControl);
            if (!hasControl) {
                variants[0].isControl = true;
            }

            const result = await db.query(
                `INSERT INTO ab_experiments (
                    tenant_id, name, description, variants, 
                    target_metric, sample_size, duration_days,
                    status, started_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW())
                RETURNING id`,
                [
                    tenantId,
                    name,
                    description,
                    JSON.stringify(variants),
                    targetMetric,
                    sampleSize,
                    duration
                ]
            );

            const experimentId = result.rows[0].id;

            // Cache experiment
            this.activeExperiments.set(experimentId, {
                ...config,
                id: experimentId,
                startedAt: new Date()
            });

            logger.info({ experimentId, name }, 'A/B experiment created');

            return experimentId;

        } catch (error) {
            logger.error({ err: error }, 'Failed to create experiment');
            throw error;
        }
    }

    /**
     * Assign lead to experiment variant
     */
    async assignVariant(experimentId, leadId) {
        try {
            const experiment = await this._getExperiment(experimentId);

            if (!experiment || experiment.status !== 'active') {
                return null;
            }

            // Check if already assigned
            const existing = await db.query(
                'SELECT variant_id FROM ab_assignments WHERE experiment_id = $1 AND lead_id = $2',
                [experimentId, leadId]
            );

            if (existing.rows.length > 0) {
                return existing.rows[0].variant_id;
            }

            // Get variant counts
            const counts = await db.query(
                `SELECT variant_id, COUNT(*) as count
                 FROM ab_assignments
                 WHERE experiment_id = $1
                 GROUP BY variant_id`,
                [experimentId]
            );

            const variantCounts = new Map(counts.rows.map(r => [r.variant_id, parseInt(r.count)]));

            // Find variant with lowest count (equal distribution)
            const variants = experiment.variants;
            let selectedVariant = variants[0];
            let minCount = variantCounts.get(variants[0].id) || 0;

            for (const variant of variants) {
                const count = variantCounts.get(variant.id) || 0;
                if (count < minCount) {
                    minCount = count;
                    selectedVariant = variant;
                }
            }

            // Assign variant
            await db.query(
                `INSERT INTO ab_assignments (experiment_id, lead_id, variant_id, assigned_at)
                 VALUES ($1, $2, $3, NOW())`,
                [experimentId, leadId, selectedVariant.id]
            );

            logger.info({ experimentId, leadId, variantId: selectedVariant.id }, 'Variant assigned');

            return selectedVariant.id;

        } catch (error) {
            logger.error({ err: error, experimentId, leadId }, 'Variant assignment failed');
            return null;
        }
    }

    /**
     * Get variant for lead (with psychology prompt)
     */
    async getVariantPrompt(experimentId, leadId) {
        try {
            const result = await db.query(
                `SELECT v.prompt_template, v.name
                 FROM ab_assignments a
                 JOIN ab_experiments e ON e.id = a.experiment_id
                 JOIN LATERAL jsonb_array_elements(e.variants) v ON v->>'id' = a.variant_id
                 WHERE a.experiment_id = $1 AND a.lead_id = $2`,
                [experimentId, leadId]
            );

            if (result.rows.length === 0) {
                // Assign variant if not assigned
                const variantId = await this.assignVariant(experimentId, leadId);
                if (!variantId) return null;

                // Retry query
                return this.getVariantPrompt(experimentId, leadId);
            }

            return result.rows[0];

        } catch (error) {
            logger.error({ err: error }, 'Failed to get variant prompt');
            return null;
        }
    }

    /**
     * Record experiment result
     */
    async recordResult(experimentId, leadId, metric, value) {
        try {
            await db.query(
                `INSERT INTO ab_results (experiment_id, lead_id, metric, value, recorded_at)
                 VALUES ($1, $2, $3, $4, NOW())`,
                [experimentId, leadId, metric, value]
            );

            // Check if experiment should be stopped (kill-switch)
            await this._checkKillSwitch(experimentId);

        } catch (error) {
            logger.error({ err: error }, 'Failed to record result');
        }
    }

    /**
     * Kill-switch: Auto-stop experiment on critical issues
     */
    async _checkKillSwitch(experimentId) {
        try {
            const experiment = await this._getExperiment(experimentId);
            if (!experiment || experiment.status !== 'active') return;

            // Get recent metrics (last hour)
            const metrics = await db.query(
                `SELECT 
                    COUNT(*) FILTER (WHERE metric = 'error') as errors,
                    COUNT(*) FILTER (WHERE metric = 'response_time' AND value > 2000) as slow_responses,
                    COUNT(*) FILTER (WHERE metric = 'hallucination') as hallucinations,
                    COUNT(*) FILTER (WHERE metric = 'objection') as objections,
                    COUNT(*) as total
                 FROM ab_results
                 WHERE experiment_id = $1 
                   AND recorded_at > NOW() - INTERVAL '1 hour'`,
                [experimentId]
            );

            const stats = metrics.rows[0];

            // Kill-switch triggers (from PRD)
            const triggers = {
                errorRateSpike: stats.total > 0 && (stats.errors / stats.total) > 0.5, // >50%
                responseTimeDegradation: stats.total > 0 && (stats.slow_responses / stats.total) > 0.3, // >30%
                hallucinationIncrease: stats.hallucinations > stats.total * 0.1, // >10%
                objectionSurge: stats.objections > stats.total * 0.8 // >80%
            };

            const shouldStop = Object.values(triggers).some(t => t);

            if (shouldStop) {
                await this.stopExperiment(experimentId, 'kill_switch', triggers);
                logger.warn({ experimentId, triggers }, 'Experiment stopped by kill-switch');
            }

        } catch (error) {
            logger.error({ err: error }, 'Kill-switch check failed');
        }
    }

    /**
     * Stop experiment
     */
    async stopExperiment(experimentId, reason = 'manual', metadata = {}) {
        try {
            await db.query(
                `UPDATE ab_experiments 
                 SET status = 'stopped', 
                     stopped_at = NOW(),
                     stop_reason = $2,
                     stop_metadata = $3
                 WHERE id = $1`,
                [experimentId, reason, JSON.stringify(metadata)]
            );

            // Remove from cache
            this.activeExperiments.delete(experimentId);

            // Rollback to control variant
            await this._rollbackToControl(experimentId);

            logger.info({ experimentId, reason }, 'Experiment stopped');

        } catch (error) {
            logger.error({ err: error }, 'Failed to stop experiment');
        }
    }

    /**
     * Calculate statistical significance
     */
    async calculateSignificance(experimentId) {
        try {
            const results = await db.query(
                `SELECT 
                    a.variant_id,
                    COUNT(*) as sample_size,
                    AVG(CASE WHEN r.metric = 'conversion' AND r.value = 1 THEN 1 ELSE 0 END) as conversion_rate,
                    AVG(CASE WHEN r.metric = 'response_rate' AND r.value = 1 THEN 1 ELSE 0 END) as response_rate,
                    AVG(CASE WHEN r.metric = 'time_to_conversion' THEN r.value ELSE NULL END) as avg_time_to_conversion
                 FROM ab_assignments a
                 LEFT JOIN ab_results r ON r.experiment_id = a.experiment_id AND r.lead_id = a.lead_id
                 WHERE a.experiment_id = $1
                 GROUP BY a.variant_id`,
                [experimentId]
            );

            const variants = results.rows;

            if (variants.length < 2) {
                return { significant: false, message: 'Insufficient variants' };
            }

            // Find control variant
            const control = variants.find(v => v.variant_id === 'control') || variants[0];
            const treatments = variants.filter(v => v.variant_id !== control.variant_id);

            // Simple z-test for proportions (conversion rate)
            const significance = treatments.map(treatment => {
                const p1 = parseFloat(control.conversion_rate);
                const p2 = parseFloat(treatment.conversion_rate);
                const n1 = parseInt(control.sample_size);
                const n2 = parseInt(treatment.sample_size);

                // Pooled proportion
                const p = (p1 * n1 + p2 * n2) / (n1 + n2);
                
                // Standard error
                const se = Math.sqrt(p * (1 - p) * (1/n1 + 1/n2));
                
                // Z-score
                const z = (p2 - p1) / se;
                
                // P-value (two-tailed)
                const pValue = 2 * (1 - this._normalCDF(Math.abs(z)));

                return {
                    variantId: treatment.variant_id,
                    controlRate: p1,
                    treatmentRate: p2,
                    lift: ((p2 - p1) / p1 * 100).toFixed(2) + '%',
                    zScore: z.toFixed(3),
                    pValue: pValue.toFixed(4),
                    significant: pValue < 0.05, // 95% confidence
                    sampleSize: n2
                };
            });

            return {
                experimentId,
                control: control.variant_id,
                results: significance,
                overallSignificant: significance.some(s => s.significant)
            };

        } catch (error) {
            logger.error({ err: error }, 'Significance calculation failed');
            return { significant: false, error: error.message };
        }
    }

    /**
     * Normal CDF approximation (for z-test)
     */
    _normalCDF(x) {
        const t = 1 / (1 + 0.2316419 * Math.abs(x));
        const d = 0.3989423 * Math.exp(-x * x / 2);
        const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        return x > 0 ? 1 - prob : prob;
    }

    async _rollbackToControl(experimentId) {
        // Mark all non-control assignments as inactive
        await db.query(
            `UPDATE ab_assignments 
             SET active = false 
             WHERE experiment_id = $1 AND variant_id != 'control'`,
            [experimentId]
        );
    }

    async _getExperiment(experimentId) {
        // Check cache first
        if (this.activeExperiments.has(experimentId)) {
            return this.activeExperiments.get(experimentId);
        }

        const result = await db.query(
            'SELECT * FROM ab_experiments WHERE id = $1',
            [experimentId]
        );

        return result.rows[0] || null;
    }

    /**
     * Initialize monitoring (check experiments daily)
     */
    init() {
        // Check experiments daily at midnight
        cron.schedule('0 0 * * *', async () => {
            await this._checkExperimentDurations();
        });

        // Check kill-switches every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            const experiments = await db.query(
                "SELECT id FROM ab_experiments WHERE status = 'active'"
            );

            for (const exp of experiments.rows) {
                await this._checkKillSwitch(exp.id);
            }
        });

        logger.info('A/B testing service initialized');
    }

    async _checkExperimentDurations() {
        // Stop experiments that exceeded duration
        await db.query(
            `UPDATE ab_experiments 
             SET status = 'completed', stopped_at = NOW()
             WHERE status = 'active' 
               AND started_at < NOW() - (duration_days || ' days')::INTERVAL`
        );
    }
}

module.exports = new ABTestingService();
