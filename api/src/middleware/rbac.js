const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * RBAC (Role-Based Access Control) Middleware
 * 7 Roles: Admin, Manager, SDR, Product, DevOps, Auditor, ReadOnly
 */

const ROLES = {
    admin: {
        leads: ['create', 'read', 'update', 'delete'],
        sdrs: ['create', 'read', 'update', 'delete'],
        settings: ['read', 'update'],
        billing: ['read', 'update'],
        audit: ['read']
    },
    manager: {
        leads: ['create', 'read', 'update'],
        sdrs: ['read'],
        settings: ['read'],
        billing: ['read'],
        audit: ['read']
    },
    sdr: {
        leads: ['read_assigned'],  // Only assigned leads
        sdrs: [],
        settings: [],
        billing: [],
        audit: []
    },
    product: {
        leads: ['read'],
        sdrs: [],
        settings: ['read', 'update'],
        billing: [],
        audit: ['read']
    },
    devops: {
        leads: [],
        sdrs: [],
        settings: ['read_infra'],
        billing: [],
        audit: ['read_logs']
    },
    auditor: {
        leads: ['read'],
        sdrs: [],
        settings: [],
        billing: [],
        audit: ['read']
    },
    readonly: {
        leads: ['read'],
        sdrs: [],
        settings: [],
        billing: [],
        audit: []
    }
};

async function requirePermission(resource, action) {
    return async (req, res, next) => {
        try {
            const user = req.user;

            if (!user || !user.role) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const rolePermissions = ROLES[user.role.toLowerCase()];

            if (!rolePermissions) {
                return res.status(403).json({ error: 'Invalid role' });
            }

            const resourcePermissions = rolePermissions[resource];

            if (!resourcePermissions || !resourcePermissions.includes(action)) {
                logger.warn({ user: user.id, role: user.role, resource, action }, 'Permission denied');
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    required: `${resource}:${action}`,
                    userRole: user.role
                });
            }

            // Special case for SDR: check if lead is assigned to them
            if (user.role === 'sdr' && action === 'read_assigned' && req.params.leadId) {
                const isAssigned = await checkLeadAssignment(req.params.leadId, user.id);
                if (!isAssigned) {
                    return res.status(403).json({ error: 'You can only access your assigned leads' });
                }
            }

            next();

        } catch (error) {
            logger.error({ err: error }, 'RBAC middleware failed');
            next(error);
        }
    };
}

async function checkLeadAssignment(leadId, userId) {
    try {
        const res = await db.query(
            `SELECT 1 FROM leads WHERE id = $1 AND assigned_sdr_id = $2`,
            [leadId, userId]
        );
        return res.rows.length > 0;
    } catch (error) {
        logger.error({ err: error }, 'Lead assignment check failed');
        return false;
    }
}

// MFA enforcement for Admin/Manager
async function requireMFA(req, res, next) {
    const user = req.user;

    if (['admin', 'manager'].includes(user?.role?.toLowerCase())) {
        if (!user.mfa_verified) {
            return res.status(403).json({
                error: 'MFA required',
                message: 'Please complete MFA verification to access this resource'
            });
        }
    }

    next();
}

module.exports = {
    requirePermission,
    requireMFA,
    ROLES
};
