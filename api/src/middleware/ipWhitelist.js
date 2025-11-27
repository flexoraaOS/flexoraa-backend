// IP Whitelist Middleware
// Restricts access to sensitive routes based on IP address
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * IP Whitelist Middleware
 * @param {Array<string>} allowedIps - Optional override, defaults to env config
 */
const ipWhitelist = (allowedIps = null) => {
    // Parse allowed IPs from config if not provided
    const whitelist = allowedIps || (config.ADMIN_ALLOWLIST_IPS ? config.ADMIN_ALLOWLIST_IPS.split(',') : []);

    return (req, res, next) => {
        // Skip if no whitelist configured (dev mode or open access)
        // BUT for admin routes, we might want to default to deny if not configured?
        // For now, if no whitelist is set, we assume it's disabled/open (or handled by VPN)
        if (whitelist.length === 0) {
            return next();
        }

        // Get client IP
        // Trust proxy should be enabled in Express app for this to work behind load balancers
        let clientIp = req.ip;

        // Handle IPv6 mapped IPv4
        if (clientIp.substr(0, 7) == "::ffff:") {
            clientIp = clientIp.substr(7);
        }

        if (whitelist.includes(clientIp)) {
            return next();
        }

        logger.warn({ ip: clientIp, path: req.path }, 'Access denied by IP whitelist');
        return res.status(403).json({ error: 'Access denied' });
    };
};

module.exports = ipWhitelist;
