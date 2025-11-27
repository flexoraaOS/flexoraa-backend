// Express Application
// Main entry point for Flexoraa Backend API
require('dotenv').config({ path: '../.env' });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');
const promClient = require('prom-client');

// Config & Utils
const config = require('./config/env');
const logger = require('./utils/logger');
const db = require('./config/database');

// Middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');

// Routes
const healthRouter = require('./routes/health');
const webhooksRouter = require('./routes/webhooks');
const campaignsRouter = require('./routes/campaigns');
const leadsRouter = require('./routes/leads');

// Initialize Express
const app = express();
const PORT = config.PORT;

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const workflowExecutions = new promClient.Counter({
  name: 'workflow_executions_total',
  help: 'Total workflow executions',
  labelNames: ['workflow', 'status'],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(workflowExecutions);

// Make metrics available to routes
app.locals.metrics = {
  httpRequestDuration,
  httpRequestTotal,
  workflowExecutions,
};

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN || '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(pinoHttp({ logger }));

// Metrics tracking middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  next();
});

// Global rate limiting
app.use(globalLimiter);

// Routes
app.use('/health', healthRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/campaigns', campaignsRouter);
const leadsRouter = require('./routes/leads');
const adminRouter = require('./routes/admin');
const ipWhitelist = require('./middleware/ipWhitelist');

// ... (existing code)

// Routes
app.use('/health', healthRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/leads', leadsRouter);

// Admin Routes (Protected)
app.use('/api/admin', ipWhitelist(), adminRouter);

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
if (require.main === module) {
  const server = app.listen(PORT, async () => {
    logger.info(`🚀 Flexoraa API server running on port ${PORT}`);
    logger.info(`📊 Metrics available at http://localhost:${PORT}/metrics`);
    logger.info(`💚 Health check at http://localhost:${PORT}/health`);
    logger.info(`🔧 Environment: ${config.NODE_ENV}`);

    // Check database connection
    const dbHealth = await db.healthCheck();
    if (dbHealth.healthy) {
      logger.info('✅ Database connection established');
    } else {
      logger.error({ err: dbHealth.error }, '❌ Database connection failed');
    }
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('🛑 Shutting down gracefully...');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = app;
