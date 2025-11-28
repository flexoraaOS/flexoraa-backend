const cron = require('node-cron');
const db = require('../../config/database');
const logger = require('../../utils/logger');
const unifiedInboxService = require('./unifiedInboxService');

class SchedulerService {
    constructor() {
        this.jobs = [];
    }

    /**
     * Initialize all cron jobs
     */
    init() {
        logger.info('Initializing Scheduler Service...');

        // Run every minute to check for scheduled messages
        this.scheduleJob('* * * * *', this.processScheduledMessages.bind(this));

        // Run daily cleanup at 3 AM
        this.scheduleJob('0 3 * * *', this.cleanupOldLogs.bind(this));

        logger.info('Scheduler Service initialized');
    }

    scheduleJob(cronExpression, callback) {
        const job = cron.schedule(cronExpression, async () => {
            try {
                await callback();
            } catch (error) {
                logger.error({ err: error }, 'Cron Job Failed');
            }
        });
        this.jobs.push(job);
    }

    /**
     * Process pending scheduled messages
     */
    async processScheduledMessages() {
        const client = await db.connect();
        try {
            // 1. Lock and fetch pending messages due now or in past
            await client.query('BEGIN');

            const result = await client.query(
                `SELECT * FROM scheduled_messages 
                 WHERE status = 'pending' 
                   AND scheduled_at <= NOW() 
                 FOR UPDATE SKIP LOCKED 
                 LIMIT 50`
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return;
            }

            logger.info({ count: result.rows.length }, 'Processing scheduled messages');

            for (const msg of result.rows) {
                try {
                    // 2. Send Message via Unified Inbox
                    await unifiedInboxService.sendMessage(
                        msg.lead_id,
                        msg.channel,
                        msg.content,
                        msg.tenant_id
                    );

                    // 3. Mark as Sent
                    await client.query(
                        "UPDATE scheduled_messages SET status = 'sent', updated_at = NOW() WHERE id = $1",
                        [msg.id]
                    );
                } catch (error) {
                    logger.error({ err: error, msgId: msg.id }, 'Failed to send scheduled message');
                    await client.query(
                        "UPDATE scheduled_messages SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2",
                        [error.message, msg.id]
                    );
                }
            }

            await client.query('COMMIT');

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error({ err: error }, 'Scheduler Error');
        } finally {
            client.release();
        }
    }

    /**
     * Cleanup old logs (Example)
     */
    async cleanupOldLogs() {
        // Delete logs older than 30 days
        // await db.query("DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '30 days'");
        logger.info('Daily cleanup completed');
    }
}

module.exports = new SchedulerService();
