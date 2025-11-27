// Database Connection Manager
// Handles Postgres connection pooling with row-level security
const { Pool } = require('pg');
const config = require('./env');
const logger = require('../utils/logger');

// Connection pool configuration
const poolConfig = {
    host: config.POSTGRES_HOST,
    port: config.POSTGRES_PORT,
    database: config.POSTGRES_DB,
    user: config.POSTGRES_USER,
    password: config.POSTGRES_PASSWORD,
    max: 20, // Maximum connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// Create pool
const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected database pool error');
});

// Set session variables for RLS (actor tracking)
const setSessionContext = async (client, userId, actorType = 'api') => {
    if (userId) {
        await client.query(`SET SESSION app.current_user_id = '${userId}'`);
    }
    await client.query(`SET SESSION app.current_actor_type = '${actorType}'`);
};

// Query wrapper with logging
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        logger.debug({ query: text, duration, rows: result.rowCount }, 'Database query executed');
        return result;
    } catch (error) {
        logger.error({ err: error, query: text }, 'Database query failed');
        throw error;
    }
};

// Transaction wrapper
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Health check
const healthCheck = async () => {
    try {
        const result = await query('SELECT NOW()');
        return { healthy: true, timestamp: result.rows[0].now };
    } catch (error) {
        return { healthy: false, error: error.message };
    }
};

// Graceful shutdown
const shutdown = async () => {
    logger.info('Closing database connection pool...');
    await pool.end();
    logger.info('Database connection pool closed');
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = {
    pool,
    query,
    transaction,
    setSessionContext,
    healthCheck,
};
