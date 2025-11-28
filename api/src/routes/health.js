// Health Check Router
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const pineconeService = require('../services/ai/pineconeService');
const { redis } = require('../middleware/rateLimiter');

/**
 * GET /health
 * Comprehensive health check
 */
router.get('/', async (req, res) => {
    try {
        // Check database
        const dbHealth = await db.healthCheck();

        // Check Redis
        let redisHealthy = false;
        try {
            await redis.ping();
            redisHealthy = true;
        } catch (err) {
            redisHealthy = false;
        }

        // Check Pinecone (if enabled)
        let pineconeHealthy = null;
        if (process.env.ENABLE_PINECONE_RAG === 'true') {
            try {
                await pineconeService.initialize();
                pineconeHealthy = true;
            } catch (err) {
                pineconeHealthy = false;
            }
        }

        const allHealthy = dbHealth.healthy && redisHealthy;

        res.status(allHealthy ? 200 : 503).json({
            status: allHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: process.env.NODE_ENV,
            services: {
                database: {
                    status: dbHealth.healthy ? 'up' : 'down',
                    timestamp: dbHealth.timestamp
                },
                redis: {
                    status: redisHealthy ? 'up' : 'down'
                },
                pinecone: pineconeHealthy !== null ? {
                    status: pineconeHealthy ? 'up' : 'down'
                } : null
            }
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /health/ready
 * Kubernetes readiness probe
 */
router.get('/ready', async (req, res) => {
    const dbHealth = await db.healthCheck();

    if (dbHealth.healthy) {
        res.status(200).json({ ready: true });
    } else {
        res.status(503).json({ ready: false });
    }
});

/**
 * GET /health/live
 * Kubernetes liveness probe
 */
router.get('/live', (req, res) => {
    res.status(200).json({ alive: true });
});

module.exports = router;
