// Unit Test: Booking Service
const bookingService = require('../../../src/services/booking/bookingService');
const db = require('../../../src/config/database');

jest.mock('../../../src/config/database');

describe('Booking Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateBookingToken', () => {
        it('should generate valid HMAC token', () => {
            const leadId = 'lead-123';
            const expiresAt = Date.now() + 86400000;

            const token = bookingService.generateBookingToken(leadId, expiresAt);

            expect(token).toContain(leadId);
            expect(token).toContain(expiresAt.toString());
            expect(token.split(':')).toHaveLength(3); // leadId:expiresAt:signature
        });
    });

    describe('verifyBookingToken', () => {
        it('should verify valid token', () => {
            const leadId = 'lead-123';
            const expiresAt = Date.now() + 86400000;
            const token = bookingService.generateBookingToken(leadId, expiresAt);

            const result = bookingService.verifyBookingToken(token);

            expect(result).toHaveProperty('valid', true);
            expect(result).toHaveProperty('leadId', leadId);
        });

        it('should reject invalid signature', () => {
            const token = 'lead-123:1234567890:invalidsignature';
            const result = bookingService.verifyBookingToken(token);

            expect(result).toBeNull();
        });

        it('should reject expired token', () => {
            const leadId = 'lead-123';
            const expiresAt = Date.now() - 1000; // Already expired
            const token = bookingService.generateBookingToken(leadId, expiresAt);

            const result = bookingService.verifyBookingToken(token);

            expect(result).toHaveProperty('valid', false);
            expect(result).toHaveProperty('error', 'Token expired');
        });
    });

    describe('createBookingLink', () => {
        it('should create booking link in database', async () => {
            const mockResult = {
                rows: [{
                    id: 'booking-id-123',
                    lead_id: 'lead-123',
                    token: 'generated-token',
                    expires_at: new Date()
                }]
            };

            db.query.mockResolvedValue(mockResult);

            const result = await bookingService.createBookingLink('lead-123', { source: 'email' });

            expect(result).toHaveProperty('id', 'booking-id-123');
            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('url');
            expect(db.query).toHaveBeenCalled();
        });
    });

    describe('acceptBookingLink', () => {
        it('should accept valid booking link', async () => {
            const leadId = 'lead-123';
            const expiresAt = Date.now() + 86400000;
            const token = bookingService.generateBookingToken(leadId, expiresAt);

            db.query
                .mockResolvedValueOnce({ rows: [{ id: 'booking-id', lead_id: leadId, accepted_at: null, expires_at: new Date(expiresAt) }] }) // SELECT
                .mockResolvedValueOnce({ rows: [{ accepted_at: new Date() }] }) // UPDATE booking
                .mockResolvedValueOnce({ rows: [] }); // UPDATE lead

            const result = await bookingService.acceptBookingLink(token);

            expect(result).toHaveProperty('leadId', leadId);
            expect(result).toHaveProperty('acceptedAt');
        });

        it('should reject already accepted booking', async () => {
            const leadId = 'lead-123';
            const expiresAt = Date.now() + 86400000;
            const token = bookingService.generateBookingToken(leadId, expiresAt);

            db.query.mockResolvedValue({ rows: [{ id: 'booking-id', lead_id: leadId, accepted_at: new Date(), expires_at: new Date(expiresAt) }] });

            await expect(bookingService.acceptBookingLink(token)).rejects.toThrow('already accepted');
        });
    });
});
