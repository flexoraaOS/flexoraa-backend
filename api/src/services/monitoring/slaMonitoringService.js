// SLA Monitoring Service
// Tracks: Uptime (99.9%), Response Times (P90 < 1s), Error Rates
const db = require('../../config/database');
const logger = require('../../utils/logger');
const cron = require('node-cron');

class SLAMonitoringService {
    constructor() {
        this.metrics = {
            requests: 0,
            errors: 0,
            responseTimes: [],
            uptime: {
                start: Date.now(),
                downtime: 0
            }
        };

        // SLA targets from PRD
        this.targets = {
            uptime: 99.9, // 99.9% per month (max 43.2 min downtime)
            aiMessageP90: 1000, // 1s in ms
            verificationP90: 500, // 500ms
            routingP90: 5000, // 5s
            errorRate: 0.1 // 0.1%
        };
    }

    /**
     * Initialize monitoring
     */
    init() {
        // Record metrics every minute
        cron.schedule('* * * * *', async () => {
            await this.recordMetrics();
        });

        // Generate SLA report daily
        cron.schedule('0 0 * * *', async () => {
            await this.generateDailyReport();
        });

        // Check SLA violations every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            await this.checkViolations();
        });

        logger.info('SLA monitoring initialized');
    }

    /**
     * Track request metrics
     */
    trackRequest(operation, duration, success = true) {
        this.metrics.requests++;
        this.metrics.responseTimes.push({ operation, duration, timestamp: Date.now() });

        if (!success) {
            this.metrics.errors++;
        }

        // Keep only last 1000 response times in memory
        if (this.metrics.responseTimes.length > 1000) {
            this.metrics.responseTimes.shift();
        }
    }

    /**
     * Calculate P90 response time
     */
    calculateP90(operation = null) {
        let times = this.metrics.responseTimes;

        if (operation) {
            times = times.filter(t => t.operation === operation);
        }

        if (times.length === 0) return 0;

        const sorted = times.map(t => t.duration).sort((a, b) => a - b);
        const p90Index = Math.floor(sorted.length * 0.9);

        return sorted[p90Index];
    }

    /**
     * Calculate error rate
     */
    calculateErrorRate() {
        if (this.metrics.requests === 0) return 0;
        return (this.metrics.errors / this.metrics.requests) * 100;
    }

    /**
     * Calculate uptime percentage
     */
    calculateUptime() {
        const totalTime = Date.now() - this.metrics.uptime.start;
        const uptimeMs = totalTime - this.metrics.uptime.downtime;
        return (uptimeMs / totalTime) * 100;
    }

    /**
     * Record downtime
     */
    recordDowntime(durationMs) {
        this.metrics.uptime.downtime += durationMs;
        logger.warn({ durationMs }, 'Downtime recorded');
    }

    /**
     * Record metrics to database
     */
    async recordMetrics() {
        try {
            const p90AI = this.calculateP90('ai_message');
            const p90Verification = this.calculateP90('verification');
            const p90Routing = this.calculateP90('routing');
            const errorRate = this.calculateErrorRate();
            const uptime = this.calculateUptime();

            await db.query(
                `INSERT INTO sla_metrics (
                    timestamp, 
                    requests_total, 
                    errors_total,
                    error_rate,
                    p90_ai_message,
                    p90_verification,
                    p90_routing,
                    uptime_percent
                ) VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7)`,
                [
                    this.metrics.requests,
                    this.metrics.errors,
                    errorRate,
                    p90AI,
                    p90Verification,
                    p90Routing,
                    uptime
                ]
            );

            // Reset counters (keep uptime tracking)
            this.metrics.requests = 0;
            this.metrics.errors = 0;
            this.metrics.responseTimes = [];

        } catch (error) {
            logger.error({ err: error }, 'Failed to record metrics');
        }
    }

    /**
     * Check for SLA violations
     */
    async checkViolations() {
        try {
            const p90AI = this.calculateP90('ai_message');
            const errorRate = this.calculateErrorRate();
            const uptime = this.calculateUptime();

            const violations = [];

            // Check AI message P90
            if (p90AI > this.targets.aiMessageP90) {
                violations.push({
                    metric: 'ai_message_p90',
                    target: this.targets.aiMessageP90,
                    actual: p90AI,
                    severity: 'warning'
                });
            }

            // Check error rate
            if (errorRate > this.targets.errorRate) {
                violations.push({
                    metric: 'error_rate',
                    target: this.targets.errorRate,
                    actual: errorRate,
                    severity: errorRate > 1 ? 'critical' : 'warning'
                });
            }

            // Check uptime
            if (uptime < this.targets.uptime) {
                violations.push({
                    metric: 'uptime',
                    target: this.targets.uptime,
                    actual: uptime,
                    severity: 'critical'
                });
            }

            // Alert on violations
            for (const violation of violations) {
                await this.alertViolation(violation);
            }

        } catch (error) {
            logger.error({ err: error }, 'SLA violation check failed');
        }
    }

    /**
     * Alert on SLA violation
     */
    async alertViolation(violation) {
        logger.warn({ violation }, 'SLA violation detected');

        // Store violation
        await db.query(
            `INSERT INTO sla_violations (
                metric, target_value, actual_value, severity, detected_at
            ) VALUES ($1, $2, $3, $4, NOW())`,
            [violation.metric, violation.target, violation.actual, violation.severity]
        );

        // Send alert to admins
        if (violation.severity === 'critical') {
            const emailService = require('../emailService');
            
            const admins = await db.query(
                "SELECT email FROM users WHERE role = 'admin'"
            );

            for (const admin of admins.rows) {
                await emailService.sendEmail({
                    to: admin.email,
                    subject: `🚨 Critical SLA Violation: ${violation.metric}`,
                    html: `
                        <h2>SLA Violation Alert</h2>
                        <p><strong>Metric:</strong> ${violation.metric}</p>
                        <p><strong>Target:</strong> ${violation.target}</p>
                        <p><strong>Actual:</strong> ${violation.actual}</p>
                        <p><strong>Severity:</strong> ${violation.severity}</p>
                        <p>Immediate action required.</p>
                    `
                });
            }
        }
    }

    /**
     * Generate daily SLA report
     */
    async generateDailyReport() {
        try {
            const result = await db.query(
                `SELECT 
                    AVG(p90_ai_message) as avg_p90_ai,
                    AVG(p90_verification) as avg_p90_verification,
                    AVG(p90_routing) as avg_p90_routing,
                    AVG(error_rate) as avg_error_rate,
                    AVG(uptime_percent) as avg_uptime,
                    COUNT(*) FILTER (WHERE error_rate > $1) as error_violations,
                    COUNT(*) FILTER (WHERE uptime_percent < $2) as uptime_violations
                 FROM sla_metrics
                 WHERE timestamp > NOW() - INTERVAL '24 hours'`,
                [this.targets.errorRate, this.targets.uptime]
            );

            const report = result.rows[0];

            logger.info({ report }, 'Daily SLA report generated');

            // Store report
            await db.query(
                `INSERT INTO sla_daily_reports (
                    report_date, metrics, violations
                ) VALUES (CURRENT_DATE, $1, $2)`,
                [
                    JSON.stringify({
                        avg_p90_ai: report.avg_p90_ai,
                        avg_p90_verification: report.avg_p90_verification,
                        avg_p90_routing: report.avg_p90_routing,
                        avg_error_rate: report.avg_error_rate,
                        avg_uptime: report.avg_uptime
                    }),
                    JSON.stringify({
                        error_violations: report.error_violations,
                        uptime_violations: report.uptime_violations
                    })
                ]
            );

        } catch (error) {
            logger.error({ err: error }, 'Daily report generation failed');
        }
    }

    /**
     * Get SLA dashboard data
     */
    async getDashboardData(days = 7) {
        const result = await db.query(
            `SELECT 
                DATE(timestamp) as date,
                AVG(p90_ai_message) as p90_ai,
                AVG(error_rate) as error_rate,
                AVG(uptime_percent) as uptime
             FROM sla_metrics
             WHERE timestamp > NOW() - INTERVAL '${days} days'
             GROUP BY DATE(timestamp)
             ORDER BY date DESC`,
            []
        );

        return result.rows;
    }
}

module.exports = new SLAMonitoringService();
