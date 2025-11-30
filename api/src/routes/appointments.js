const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const appointmentService = require('../services/appointments/appointmentService');

/**
 * GET /api/appointments/slots/:leadId
 * Get available appointment slots for a lead
 */
router.get('/slots/:leadId', verifyJWT, asyncHandler(async (req, res) => {
    const { leadId } = req.params;
    const slots = await appointmentService.offerSlots(leadId);
    res.json({ slots });
}));

/**
 * POST /api/appointments/book
 * Book an appointment
 */
router.post('/book', verifyJWT, asyncHandler(async (req, res) => {
    const { leadId, slotDateTime } = req.body;
    const sdrId = req.user.id; // Assuming JWT contains user ID

    const appointmentId = await appointmentService.bookAppointment(leadId, slotDateTime, sdrId);

    res.json({
        success: true,
        appointmentId,
        message: 'Appointment booked successfully'
    });
}));

module.exports = router;
