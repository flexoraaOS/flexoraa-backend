const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const db = require('../config/database');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * POST /auth/login
 * Basic login to get JWT
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // In a real app, verify password hash
        // For now, just check if user exists
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                tenantId: user.tenant_id
            },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token });
    } catch (error) {
        logger.error('Login error', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
