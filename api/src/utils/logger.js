// Pino Logger Configuration
const pino = require('pino');
const config = require('../config/env');

const logger = pino({
    level: config.LOG_LEVEL,
    transport: config.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
        }
    } : undefined,
    base: {
        env: config.NODE_ENV
    }
});

module.exports = logger;
