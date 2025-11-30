// Model Drift Monitoring Service
// Tracks AI model performance and detects drift
const db = require('../../config/database');
const logger = require('../../utils/logger');
const cron = require('node-cron');

class DriftMonitoringService {
    constructor() {
        // Baseline performance metrics (from PRD Model Card)
        this.baseline = {
            intentPrecision: 0.94,
            intentRecall: 0.91,
            intentF1: 0.925,
            intentAccuracy: 0.93,
            budgetAccuracy: 0.87,
            confidenceThreshold: 0.6
        };

        // Drift thresholds
        this.driftThreshold = 0.10; // 10% change triggers alert
        this.criticalThreshold = 0.05; // 5% drop triggers auto-rollback
    }

    /**
     * Record AI prediction for monitoring
     */
    async recordPrediction(prediction) {
        try {
            const {
                leadId,
                modelVersion = '1.0',
                predictionType, // 'intent', 'budget', 'timeline', 'score'
                predictedValue,
                confidence,
                actualValue = null, // Set later when ground truth available
                metadata = {}
            } = prediction;

            await db.query(
                `INSERT INTO model_predictions (
                    lead_id, model_version, prediction_type,
                    predicted_value, confidence, actual_value,
                    metadata, predicted_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                [
                    leadId,
                    modelVersion,
                    predictionType,
                    predictedValue,
                    confidence,
                    actualValue,
                    JSON.stringify(metadata)
                ]
            );

        } catch (error) {
            logger.error({ err: error }, 'Failed to record prediction');
        }
    }

    /**
     * Update prediction with actual value (ground truth)
     */
    async updateGroundTruth(leadId, predictionType, actualValue) {
        try {
            await db.query(
                `UPDATE model_predictions 
                 SET actual_value = $1, 
                     verified_at = NOW()
                 WHERE lead_id = $2 
                   AND prediction_type = $3 
                   AND actual_value IS NULL
                 ORDER BY predicted_at DESC
                 LIMIT 1`,
                [actualValue, leadId, predictionType]
            );

        } catch (error) {
            logger.error({ err: error }, 'Failed to update ground truth');
        }
    }

    /**
     * Calculate current model performance
     */
    async calculatePerformance(modelVersion = '1.0', days = 7) {
        try {
            // Get predictions with ground truth from last N days
            const result = await db.query(
                `SELECT 
                    prediction_type,
                    predicted_value,
                    actual_value,
                    confidence
                 FROM model_predictions
                 WHERE model_version = $1
                   AND actual_value IS NOT NULL
                   AND predicted_at > NOW() - INTERVAL '${days} days'`,
                [modelVersion]
            );

            const predictions = result.rows;

            if (predictions.length < 100) {
                logger.warn({ count: predictions.length }, 'Insufficient predictions for drift analysis');
                return null;
            }

            // Calculate metrics by prediction type
            const intentPredictions = predictions.filter(p => p.prediction_type === 'intent');
            const budgetPredictions = predictions.filter(p => p.prediction_type === 'budget');

            const metrics = {
                intent: this._calculateClassificationMetrics(intentPredictions),
                budget: this._calculateAccuracy(budgetPredictions),
                sampleSize: predictions.length,
                period: `${days} days`,
                calculatedAt: new Date().toISOString()
            };

            return metrics;

        } catch (error) {
            logger.error({ err: error }, 'Performance calculation failed');
            return null;
        }
    }

    /**
     * Calculate classification metrics (precision, recall, F1)
     */
    _calculateClassificationMetrics(predictions) {
        if (predictions.length === 0) {
            return { precision: 0, recall: 0, f1: 0, accuracy: 0 };
        }

        let tp = 0, fp = 0, fn = 0, tn = 0;

        for (const pred of predictions) {
            const predicted = pred.predicted_value;
            const actual = pred.actual_value;

            // For multi-class, treat as binary (high intent vs others)
            const predHigh = predicted === 'high';
            const actualHigh = actual === 'high';

            if (predHigh && actualHigh) tp++;
            else if (predHigh && !actualHigh) fp++;
            else if (!predHigh && actualHigh) fn++;
            else tn++;
        }

        const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
        const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
        const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
        const accuracy = predictions.length > 0 ? (tp + tn) / predictions.length : 0;

        return {
            precision: parseFloat(precision.toFixed(4)),
            recall: parseFloat(recall.toFixed(4)),
            f1: parseFloat(f1.toFixed(4)),
            accuracy: parseFloat(accuracy.toFixed(4)),
            sampleSize: predictions.length
        };
    }

    /**
     * Calculate simple accuracy
     */
    _calculateAccuracy(predictions) {
        if (predictions.length === 0) {
            return { accuracy: 0, sampleSize: 0 };
        }

        const correct = predictions.filter(p => p.predicted_value === p.actual_value).length;
        const accuracy = correct / predictions.length;

        return {
            accuracy: parseFloat(accuracy.toFixed(4)),
            sampleSize: predictions.length
        };
    }

    /**
     * Detect drift by comparing current vs baseline
     */
    async detectDrift(modelVersion = '1.0') {
        try {
            const current = await this.calculatePerformance(modelVersion, 7);

            if (!current) {
                return { drift: false, message: 'Insufficient data' };
            }

            // Compare with baseline
            const intentDrift = Math.abs(current.intent.precision - this.baseline.intentPrecision);
            const budgetDrift = Math.abs(current.budget.accuracy - this.baseline.budgetAccuracy);

            const hasDrift = intentDrift > this.driftThreshold || budgetDrift > this.driftThreshold;
            const isCritical = intentDrift > this.criticalThreshold || budgetDrift > this.criticalThreshold;

            const driftReport = {
                drift: hasDrift,
                critical: isCritical,
                modelVersion,
                baseline: this.baseline,
                current: current,
                changes: {
                    intentPrecision: {
                        baseline: this.baseline.intentPrecision,
                        current: current.intent.precision,
                        change: ((current.intent.precision - this.baseline.intentPrecision) / this.baseline.intentPrecision * 100).toFixed(2) + '%'
                    },
                    budgetAccuracy: {
                        baseline: this.baseline.budgetAccuracy,
                        current: current.budget.accuracy,
                        change: ((current.budget.accuracy - this.baseline.budgetAccuracy) / this.baseline.budgetAccuracy * 100).toFixed(2) + '%'
                    }
                },
                detectedAt: new Date().toISOString()
            };

            // Store drift report
            await db.query(
                `INSERT INTO model_drift_reports (
                    model_version, has_drift, is_critical, 
                    baseline_metrics, current_metrics, 
                    drift_details, detected_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                [
                    modelVersion,
                    hasDrift,
                    isCritical,
                    JSON.stringify(this.baseline),
                    JSON.stringify(current),
                    JSON.stringify(driftReport.changes)
                ]
            );

            // Alert if drift detected
            if (hasDrift) {
                await this._alertDrift(driftReport);
            }

            // Auto-rollback if critical
            if (isCritical) {
                await this._rollbackModel(modelVersion, driftReport);
            }

            return driftReport;

        } catch (error) {
            logger.error({ err: error }, 'Drift detection failed');
            return { drift: false, error: error.message };
        }
    }

    /**
     * Alert product team about drift
     */
    async _alertDrift(driftReport) {
        try {
            const emailService = require('../emailService');

            // Get product team emails
            const admins = await db.query(
                "SELECT email FROM users WHERE role IN ('admin', 'product')"
            );

            const severity = driftReport.critical ? 'CRITICAL' : 'WARNING';

            for (const admin of admins.rows) {
                await emailService.sendEmail({
                    to: admin.email,
                    subject: `🚨 ${severity}: Model Drift Detected`,
                    html: `
                        <h2>Model Performance Drift Alert</h2>
                        <p><strong>Severity:</strong> ${severity}</p>
                        <p><strong>Model Version:</strong> ${driftReport.modelVersion}</p>
                        
                        <h3>Performance Changes:</h3>
                        <ul>
                            <li>Intent Precision: ${driftReport.changes.intentPrecision.baseline} → ${driftReport.changes.intentPrecision.current} (${driftReport.changes.intentPrecision.change})</li>
                            <li>Budget Accuracy: ${driftReport.changes.budgetAccuracy.baseline} → ${driftReport.changes.budgetAccuracy.current} (${driftReport.changes.budgetAccuracy.change})</li>
                        </ul>

                        ${driftReport.critical ? '<p><strong>⚠️ Auto-rollback initiated</strong></p>' : ''}
                        
                        <p><a href="${process.env.FRONTEND_URL}/dashboard/monitoring/drift">View Drift Report</a></p>
                    `
                });
            }

            logger.warn({ driftReport }, 'Drift alert sent');

        } catch (error) {
            logger.error({ err: error }, 'Failed to send drift alert');
        }
    }

    /**
     * Auto-rollback to previous model version
     */
    async _rollbackModel(currentVersion, driftReport) {
        try {
            // Get previous stable version
            const prevVersion = await db.query(
                `SELECT model_version 
                 FROM model_versions 
                 WHERE status = 'stable' 
                   AND model_version != $1
                 ORDER BY deployed_at DESC 
                 LIMIT 1`,
                [currentVersion]
            );

            if (prevVersion.rows.length === 0) {
                logger.error('No previous stable version found for rollback');
                return;
            }

            const rollbackVersion = prevVersion.rows[0].model_version;

            // Mark current version as unstable
            await db.query(
                `UPDATE model_versions 
                 SET status = 'unstable', 
                     rollback_reason = $1
                 WHERE model_version = $2`,
                [JSON.stringify(driftReport), currentVersion]
            );

            // Activate previous version
            await db.query(
                `UPDATE model_versions 
                 SET status = 'active', 
                     activated_at = NOW()
                 WHERE model_version = $1`,
                [rollbackVersion]
            );

            logger.warn({ 
                from: currentVersion, 
                to: rollbackVersion 
            }, 'Model auto-rollback executed');

        } catch (error) {
            logger.error({ err: error }, 'Model rollback failed');
        }
    }

    /**
     * Initialize drift monitoring (weekly checks)
     */
    init() {
        // Run drift detection weekly (Sunday midnight)
        cron.schedule('0 0 * * 0', async () => {
            logger.info('Running weekly drift detection...');
            await this.detectDrift();
        });

        // Also run on demand every 1000 predictions
        this._setupPredictionCounter();

        logger.info('Drift monitoring service initialized');
    }

    async _setupPredictionCounter() {
        // Check prediction count and trigger drift check if needed
        setInterval(async () => {
            const count = await db.query(
                `SELECT COUNT(*) as count 
                 FROM model_predictions 
                 WHERE predicted_at > NOW() - INTERVAL '7 days'`
            );

            const predictionCount = parseInt(count.rows[0].count);

            // Every 1000 predictions, check drift
            if (predictionCount > 0 && predictionCount % 1000 === 0) {
                logger.info({ predictionCount }, 'Triggering drift check (1000 predictions milestone)');
                await this.detectDrift();
            }
        }, 60000); // Check every minute
    }

    /**
     * Get drift history
     */
    async getDriftHistory(days = 30) {
        const result = await db.query(
            `SELECT * FROM model_drift_reports 
             WHERE detected_at > NOW() - INTERVAL '${days} days'
             ORDER BY detected_at DESC`,
            []
        );

        return result.rows;
    }
}

module.exports = new DriftMonitoringService();
