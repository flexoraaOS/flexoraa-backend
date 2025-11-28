const { Pool } = require('pg');
const logger = require('../utils/logger');

// Production-grade connection pool configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    // Connection pool settings
    max: 20,                    // Maximum number of clients
    min: 2,                     // Minimum number of clients
    idleTimeoutMillis: 30000,   // Close idle clients after 30s
    connectionTimeoutMillis: 2000, // Timeout if can't get connection in 2s

    // Connection lifecycle
    maxUses: 7500,              // Close and replace connection after 7500 uses
    allowExitOnIdle: true,      // Allow process to exit if all connections idle

    // Error handling
    application_name: 'flexoraa-backend',

    // SSL configuration (production)
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false // Set to true with proper certs
    } : false
});

// Error event listeners
pool.on('error', (err, client) => {
    logger.error('Unexpected database pool error', {
        error: err.message,
        stack: err.stack
    });
});

pool.on('connect', () => {
    logger.debug('New database connection established');
});

pool.on('remove', () => {
    logger.debug('Database connection removed from pool');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: closing database pool');
    await pool.end();
});

process.on('SIGINT', async () => {
    logger.info('SIGINT signal received: closing database pool');
    await pool.end();
});

// Export query function with timeout
pool.queryWithTimeout = async (text, params, timeoutMs = 5000) => {
    const client = await pool.connect();

    try {
        // Set statement timeout
        await client.query(`SET statement_timeout = ${timeoutMs}`);
        const result = await client.query(text, params);
        return result;
    } finally {
        client.release();
    }
};

module.exports = pool;
