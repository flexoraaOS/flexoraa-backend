/**
 * Worker A - Lightweight Task Processor
 * Handles 200 ops/sec with minimal resource usage
 * Processes NORMAL and LOW priority queues
 */

const { Kafka } = require('kafkajs');
const Redis = require('ioredis');
const { Pool } = require('pg');
const logger = require('../src/utils/logger');

// Configuration
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DB_URL = process.env.DB_URL || 'postgres://user:pass@localhost:5432/flexoraa';
const WORKER_ID = `worker-a-${process.env.HOSTNAME || Math.random().toString(36).substr(2, 9)}`;
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT || '10');
const THIN_MODE_ENABLED = process.env.THIN_MODE_ENABLED === 'true';

// Initialize clients
const kafka = new Kafka({ clientId: WORKER_ID, brokers: KAFKA_BROKERS });
const consumer = kafka.consumer({ groupId: 'worker-a-group' });
const redis = new Redis(REDIS_URL);
const db = new Pool({ connectionString: DB_URL, max: 20 });

// Metrics
let processedCount = 0;
let errorCount = 0;
let thinModeActive = false;

/**
 * Check if thin-mode should be activated
 */
async function checkThinMode() {
    if (!THIN_MODE_ENABLED) return false;

    try {
        const lag = await redis.get('queue:normal:lag_seconds');
        if (parseInt(lag || '0') > 30) {
            if (!thinModeActive) {
                logger.warn('[Worker A] Activating THIN MODE - queue lag > 30s');
                thinModeActive = true;
            }
            return true;
        } else if (thinModeActive && parseInt(lag || '0') < 10) {
            logger.info('[Worker A] Deactivating THIN MODE - queue lag normalized');
            thinModeActive = false;
        }
    } catch (error) {
        logger.error('[Worker A] Failed to check thin mode', { error });
    }
    return thinModeActive;
}

/**
 * Process a single message
 */
async function processMessage(message) {
    const startTime = Date.now();
    const payload = JSON.parse(message.value.toString());

    try {
        // Check idempotency
        const idempotencyKey = payload.idempotency_key || `msg-${message.offset}`;
        const cached = await redis.get(`idempotency:${idempotencyKey}`);
        if (cached) {
            logger.debug('[Worker A] Skipping duplicate message', { idempotencyKey });
            return { status: 'duplicate', processingTime: Date.now() - startTime };
        }

        // Check thin-mode
        const inThinMode = await checkThinMode();

        // Process based on task type
        let result;
        switch (payload.task_type) {
            case 'lead_qualification':
                result = await processLeadQualification(payload, inThinMode);
                break;
            case 'data_enrichment':
                // Skip enrichment in thin-mode
                if (inThinMode) {
                    logger.debug('[Worker A] Skipping enrichment (thin-mode)');
                    result = { status: 'skipped', reason: 'thin_mode' };
                } else {
                    result = await processEnrichment(payload);
                }
                break;
            case 'cleanup':
                result = await processCleanup(payload);
                break;
            default:
                throw new Error(`Unknown task type: ${payload.task_type}`);
        }

        // Store idempotency marker
        await redis.setex(`idempotency:${idempotencyKey}`, 86400, JSON.stringify(result));

        processedCount++;
        const processingTime = Date.now() - startTime;

        logger.info('[Worker A] Message processed', {
            taskType: payload.task_type,
            processingTime: `${processingTime}ms`,
            thinMode: inThinMode
        });

        return { status: 'success', processingTime, result };
    } catch (error) {
        errorCount++;
        logger.error('[Worker A] Message processing failed', {
            error: error.message,
            payload: payload
        });
        throw error;
    }
}

/**
 * Process lead qualification (always runs, even in thin-mode)
 */
async function processLeadQualification(payload, thinMode) {
    const { lead_id, user_id } = payload;

    // Qualify lead using scoring algorithm
    const score = await calculateLeadScore(lead_id);

    // Update database
    await db.query(
        'UPDATE leads SET score = $1, qualified_at = NOW() WHERE id = $2',
        [score, lead_id]
    );

    return { lead_id, score, qualified: score > 50 };
}

/**
 * Process data enrichment (skipped in thin-mode)
 */
async function processEnrichment(payload) {
    const { lead_id } = payload;

    // Fetch additional data (mocked in this example)
    const enrichedData = {
        company_size: 'Medium',
        industry: 'Technology',
        revenue_range: '$10M-$50M'
    };

    // Update database
    await db.query(
        'UPDATE leads SET enriched_data = $1, enriched_at = NOW() WHERE id = $2',
        [JSON.stringify(enrichedData), lead_id]
    );

    return { lead_id, enriched: true };
}

/**
 * Process cleanup tasks
 */
async function processCleanup(payload) {
    const { table, older_than_days } = payload;

    const result = await db.query(
        `DELETE FROM ${table} WHERE created_at < NOW() - INTERVAL '${older_than_days} days'`
    );

    return { deleted: result.rowCount };
}

/**
 * Calculate lead score (simplified mock)
 */
async function calculateLeadScore(leadId) {
    // In production, this would use ML model or complex business rules
    return Math.floor(Math.random() * 100);
}

/**
 * Main consumer loop
 */
async function start() {
    await consumer.connect();
    await consumer.subscribe({ topics: ['leads-normal', 'leads-low'], fromBeginning: false });

    logger.info(`[Worker A] Started - ID: ${WORKER_ID}`);

    await consumer.run({
        partitionsConsumedConcurrently: MAX_CONCURRENT,
        eachMessage: async ({ topic, partition, message }) => {
            try {
                await processMessage(message);

                // Emit metrics every 100 messages
                if (processedCount % 100 === 0) {
                    logger.info('[Worker A] Metrics', {
                        processed: processedCount,
                        errors: errorCount,
                        errorRate: (errorCount / processedCount * 100).toFixed(2) + '%',
                        thinMode: thinModeActive
                    });
                }
            } catch (error) {
                logger.error('[Worker A] Fatal error in consumer', { error });
                // Implement retry logic or dead-letter queue here
            }
        },
    });
}

/**
 * Graceful shutdown
 */
async function shutdown() {
    logger.info('[Worker A] Shutting down gracefully...');
    await consumer.disconnect();
    await redis.quit();
    await db.end();
    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start worker
start().catch((error) => {
    logger.error('[Worker A] Fatal startup error', { error });
    process.exit(1);
});
