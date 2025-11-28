// Booking Service
// HMAC-signed booking link generation and validation
const crypto = require('crypto');
const config = require('../../config/env');
const db = require('../../config/database');
const logger = require('../../utils/logger');

// Use encryption key as HMAC secret (or dedicated BOOKING_SECRET env var)
const HMAC_SECRET = config.ENCRYPTION_KEY || 'default-secret-change-in-production';
const TOKEN_EXPIRY_HOURS = 48; // Booking links valid for 48 hours

/**
 * Generate HMAC-signed booking token
 */
function generateBookingToken(leadId, expiresAt) {
    const payload = `${leadId}:${expiresAt}`;
    const hmac = crypto.createHmac('sha256', HMAC_SECRET);
    hmac.update(payload);
    const signature = hmac.digest('hex');

    // Token format: {leadId}:{expiresAt}:{signature}
    return `${payload}:${signature}`;
}

/**
 * Verify HMAC-signed booking token
 */
function verifyBookingToken(token) {
    try {
        const parts = token.split(':');
        if (parts.length !== 3) return null;

        const [leadId, expiresAt, signature] = parts;

        // Regenerate signature
        const payload = `${leadId}:${expiresAt}`;
        const hmac = crypto.createHmac('sha256', HMAC_SECRET);
        hmac.update(payload);
        const expectedSignature = hmac.digest('hex');

        // Constant-time comparison to prevent timing attacks
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            return null;
        }

        // Check expiry
        const expiryTime = parseInt(expiresAt);
        if (Date.now() > expiryTime) {
            return { valid: false, error: 'Token expired' };
        }

        return { valid: true, leadId, expiresAt: new Date(expiryTime) };
    } catch (error) {
        logger.error({ err: error }, 'Token verification failed');
        return null;
    }
}

/**
 * Create booking link for a lead
 */
async function createBookingLink(leadId, metadata = {}) {
    const expiresAt = Date.now() + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
    const token = generateBookingToken(leadId, expiresAt);

    const result = await db.query(
        `INSERT INTO booking_links (lead_id, token, expires_at, metadata)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [leadId, token, new Date(expiresAt), JSON.stringify(metadata)]
    );

    logger.info({ leadId, tokenId: result.rows[0].id }, 'Booking link created');

    return {
        id: result.rows[0].id,
        token,
        expiresAt: new Date(expiresAt),
        url: `${config.PUBLIC_URL || 'http://localhost:4000'}/api/bookings/accept?token=${encodeURIComponent(token)}`
    };
}

/**
 * Accept booking link (validate and mark as accepted)
 */
async function acceptBookingLink(token) {
    // Verify token
    const verification = verifyBookingToken(token);

    if (!verification || !verification.valid) {
        throw new Error(verification?.error || 'Invalid token');
    }

    // Check if already accepted
    const existingResult = await db.query(
        'SELECT * FROM booking_links WHERE token = $1',
        [token]
    );

    if (!existingResult.rows[0]) {
        throw new Error('Booking link not found');
    }

    const booking = existingResult.rows[0];

    if (booking.accepted_at) {
        throw new Error('Booking link already accepted');
    }

    // Mark as accepted
    const result = await db.query(
        `UPDATE booking_links
         SET accepted_at = CURRENT_TIMESTAMP
         WHERE token = $1
         RETURNING *`,
        [token]
    );

    // Update lead to "booked" stage
    await db.query(
        `UPDATE leads
         SET stage = 'booked', booked_timestamp = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [booking.lead_id]
    );

    logger.info({ leadId: booking.lead_id, tokenId: booking.id }, 'Booking link accepted');

    return {
        leadId: booking.lead_id,
        acceptedAt: result.rows[0].accepted_at
    };
}

/**
 * Get booking link status
 */
async function getBookingLinkStatus(token) {
    const result = await db.query(
        'SELECT * FROM booking_links WHERE token = $1',
        [token]
    );

    if (!result.rows[0]) {
        return { found: false };
    }

    const booking = result.rows[0];
    const now = new Date();

    return {
        found: true,
        leadId: booking.lead_id,
        expiresAt: booking.expires_at,
        acceptedAt: booking.accepted_at,
        expired: now > booking.expires_at,
        status: booking.accepted_at ? 'accepted' : (now > booking.expires_at ? 'expired' : 'pending')
    };
}

module.exports = {
    createBookingLink,
    acceptBookingLink,
    getBookingLinkStatus,
    generateBookingToken,
    verifyBookingToken
};
