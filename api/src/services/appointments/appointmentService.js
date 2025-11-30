const db = require('../../config/database');
const logger = require('../../utils/logger');
const axios = require('axios');

class AppointmentService {
    /**
     * Book appointment with lead
     * Phase 1: Offer 3 quick slots
     * Phase 2: Full calendar link
     * Phase 3: Confirmation + reminders
     */
    async offerSlots(leadId) {
        try {
            // Get next 7 days, 9 AM - 5 PM slots
            const slots = this._generateQuickSlots();

            // Store offering
            await db.query(
                `INSERT INTO appointment_offerings (lead_id, offered_slots, created_at)
                 VALUES ($1, $2, NOW())`,
                [leadId, JSON.stringify(slots)]
            );

            return slots;

        } catch (error) {
            logger.error({ err: error, leadId }, 'Failed to offer slots');
            throw error;
        }
    }

    async bookAppointment(leadId, slotDateTime, sdrId) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // 1. Create appointment
            const res = await client.query(
                `INSERT INTO appointments (lead_id, sdr_id, scheduled_at, status, created_at)
                 VALUES ($1, $2, $3, 'scheduled', NOW())
                 RETURNING id`,
                [leadId, sdrId, slotDateTime]
            );
            const appointmentId = res.rows[0].id;

            // 2. Block calendar slot (if Calendar API integrated)
            const calendarEventId = await this._createCalendarEvent(sdrId, slotDateTime, leadId);

            // 3. Schedule reminders
            await this._scheduleReminders(appointmentId, slotDateTime, leadId);

            // 4. Notify SDR
            await this._notifySDR(sdrId, appointmentId, slotDateTime);

            // 5. Update lead
            await client.query(
                `UPDATE leads 
                 SET has_appointment = true, 
                     appointment_scheduled_at = $1
                 WHERE id = $2`,
                [slotDateTime, leadId]
            );

            await client.query('COMMIT');

            logger.info({ leadId, appointmentId, slotDateTime }, 'Appointment booked');

            // Deduct token
            const lead = await db.query('SELECT tenant_id FROM leads WHERE id = $1', [leadId]);
            const tokenService = require('../payment/tokenService');
            await tokenService.deductTokens(lead.rows[0].tenant_id, 1, 'appointment', `Appointment booking: ${appointmentId}`, appointmentId);

            return appointmentId;

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error({ err: error, leadId }, 'Appointment booking failed');
            throw error;
        } finally {
            client.release();
        }
    }

    _generateQuickSlots() {
        const slots = [];
        const now = new Date();

        for (let i = 1; i <= 7; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() + i);

            // Skip weekends
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            // Add 9 AM, 2 PM, 4 PM slots
            [9, 14, 16].forEach(hour => {
                const slot = new Date(date);
                slot.setHours(hour, 0, 0, 0);
                slots.push(slot);
            });

            if (slots.length >= 3) break;
        }

        return slots.slice(0, 3);
    }

    async _createCalendarEvent(sdrId, dateTime, leadId) {
        // TODO: Integrate with Google Calendar / Outlook API
        // For now, just log
        logger.info({ sdrId, dateTime, leadId }, 'Calendar event created (mock)');
        return `cal_${Date.now()}`;
    }

    async _scheduleReminders(appointmentId, dateTime, leadId) {
        // Schedule reminders: 24h before, 1h before
        const reminderTimes = [
            new Date(new Date(dateTime).getTime() - 24 * 60 * 60 * 1000), // 24h before
            new Date(new Date(dateTime).getTime() - 60 * 60 * 1000)  // 1h before
        ];

        for (const time of reminderTimes) {
            await db.query(
                `INSERT INTO scheduled_tasks (task_type, reference_id, scheduled_for, metadata)
                 VALUES ('appointment_reminder', $1, $2, $3)`,
                [appointmentId, time, JSON.stringify({ leadId })]
            );
        }
    }

    async _notifySDR(sdrId, appointmentId, dateTime) {
        // TODO: Send notification
        logger.info({ sdrId, appointmentId, dateTime }, 'SDR notified of appointment');
    }
}

module.exports = new AppointmentService();
