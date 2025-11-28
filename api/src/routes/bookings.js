// Booking Routes
const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const bookingService = require('../services/booking/bookingService');
const auditService = require('../services/audit/auditService');
const supabaseService = require('../services/database/supabaseService');

/**
 * POST /api/bookings/generate
 * Generate HMAC-signed booking link for a lead
 */
router.post(
    '/generate',
    verifyJWT,
    asyncHandler(async (req, res) => {
        const { leadId, metadata } = req.body;

        if (!leadId) {
            return res.status(400).json({ error: 'leadId required' });
        }

        // Verify lead exists and user owns it
        const lead = await supabaseService.getLeadById(leadId);
        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        if (lead.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Generate booking link
        const booking = await bookingService.createBookingLink(leadId, metadata);

        // Log audit
        await auditService.logAudit({
            leadId,
            userId: req.user.id,
            action: 'booking_link_generated',
            changes: { bookingId: booking.id },
            actor: req.user.email,
            ipAddress: req.ip
        });

        res.status(201).json(booking);
    })
);

/**
 * POST /api/bookings/accept
 * Accept booking link (validate token and mark lead as booked)
 */
router.post(
    '/accept',
    asyncHandler(async (req, res) => {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'token required' });
        }

        try {
            const result = await bookingService.acceptBookingLink(token);

            // Log audit
            await auditService.logLeadBooked(
                result.leadId,
                { user_id: null, booked_timestamp: result.acceptedAt },
                'lead_self_service',
                req.ip
            );

            res.json({
                success: true,
                leadId: result.leadId,
                acceptedAt: result.acceptedAt,
                message: 'Booking confirmed! We will contact you soon.'
            });
        } catch (error) {
            return res.status(400).json({
                error: error.message || 'Invalid or expired booking link'
            });
        }
    })
);

/**
 * GET /api/bookings/status
 * Check booking link status
 */
router.get(
    '/status',
    asyncHandler(async (req, res) => {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ error: 'token required' });
        }

        const status = await bookingService.getBookingLinkStatus(token);
        res.json(status);
    })
);

module.exports = router;
