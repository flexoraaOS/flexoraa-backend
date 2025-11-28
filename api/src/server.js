const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');

// Existing middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const leadsRoutes = require('./routes/leads');
const webhooksRoutes = require('./routes/webhooks'); // NEW

// Register routes
app.use('/api/leads', leadsRoutes);
app.use('/api/webhooks', webhooksRoutes); // NEW - Register webhook routes

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
