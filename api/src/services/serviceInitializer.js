// Service Initializer
// Starts all background services and cron jobs
const logger = require('../utils/logger');

class ServiceInitializer {
    async initializeAll() {
        logger.info('Initializing background services...');

        try {
            // 1. Lead Leakage Prevention (every 5 minutes)
            const leakageService = require('./leakage/leakagePreventionService');
            leakageService.init();
            logger.info('✅ Lead leakage prevention service started');

            // 2. SLA Monitoring
            const slaMonitoringService = require('./monitoring/slaMonitoringService');
            slaMonitoringService.init();
            logger.info('✅ SLA monitoring service started');

            // 3. Gmail Integration Polling (every 15 minutes)
            const gmailIntegrationService = require('./email/gmailIntegrationService');
            gmailIntegrationService.startPolling();
            logger.info('✅ Gmail polling service started');

            // 4. Cold Recovery Scheduler (daily at 10 AM)
            const cron = require('node-cron');
            const coldRecoveryService = require('./recovery/coldRecoveryService');
            
            cron.schedule('0 10 * * *', async () => {
                logger.info('Running scheduled cold recovery...');
                await coldRecoveryService.processScheduledRecoveries();
            });
            logger.info('✅ Cold recovery scheduler started');

            // 5. Token Threshold Checker (every hour)
            const tokenService = require('./payment/tokenService');
            
            cron.schedule('0 * * * *', async () => {
                logger.info('Checking token thresholds...');
                const db = require('../config/database');
                const result = await db.query('SELECT DISTINCT tenant_id FROM token_balances');
                
                for (const { tenant_id } of result.rows) {
                    await tokenService.checkThresholds(tenant_id);
                }
            });
            logger.info('✅ Token threshold checker started');

            // 6. Scheduled Messages Processor (every minute)
            const schedulerService = require('./schedulerService');
            schedulerService.init();
            logger.info('✅ Scheduled messages processor started');

            // 7. A/B Testing Service
            const abTestingService = require('./experimentation/abTestingService');
            abTestingService.init();
            logger.info('✅ A/B testing service started');

            // 8. Model Drift Monitoring (weekly)
            const driftMonitoringService = require('./ai/driftMonitoringService');
            driftMonitoringService.init();
            logger.info('✅ Model drift monitoring started');

            logger.info('🎉 All background services initialized successfully (8 services)');

        } catch (error) {
            logger.error({ err: error }, '❌ Service initialization failed');
            throw error;
        }
    }
}

module.exports = new ServiceInitializer();
