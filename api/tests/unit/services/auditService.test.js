// Unit Test: Audit Service
const auditService = require('../../../src/services/audit/auditService');
const db = require('../../../src/config/database');

jest.mock('../../../src/config/database');

describe('Audit Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        db.query.mockResolvedValue({ rows: [{ id: 'audit-id-123' }] });
    });

    describe('logAudit', () => {
        it('should log audit event to database', async () => {
            const auditData = {
                leadId: 'lead-123',
                userId: 'user-123',
                action: 'updated',
                changes: { before: { status: 'pending' }, after: { status: 'contacted' } },
                actor: 'user@example.com',
                ipAddress: '127.0.0.1'
            };

            const result = await auditService.logAudit(auditData);

            expect(db.query).toHaveBeenCalled();
            expect(result).toHaveProperty('id', 'audit-id-123');
        });

        it('should not throw on database error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));

            const auditData = {
                leadId: 'lead-123',
                action: 'created',
                changes: {}
            };

            await expect(auditService.logAudit(auditData)).resolves.not.toThrow();
        });
    });

    describe('logLeadCreated', () => {
        it('should log lead creation', async () => {
            const leadData = { user_id: 'user-123', phone_number: '+919876543210' };

            await auditService.logLeadCreated('lead-123', leadData, 'admin@example.com', '127.0.0.1');

            expect(db.query).toHaveBeenCalled();
            const callArgs = db.query.mock.calls[0][1];
            expect(callArgs[2]).toBe('created');
        });
    });

    describe('logLeadUpdated', () => {
        it('should log lead update with before/after', async () => {
            const before = { status: 'pending' };
            const after = { status: 'contacted', user_id: 'user-123' };

            await auditService.logLeadUpdated('lead-123', before, after, 'system', null);

            expect(db.query).toHaveBeenCalled();
            const callArgs = db.query.mock.calls[0][1];
            expect(callArgs[2]).toBe('updated');
        });
    });

    describe('getAuditTrail', () => {
        it('should retrieve audit trail for lead', async () => {
            const mockTrail = [
                { id: 'audit-1', action: 'created', created_at: new Date() },
                { id: 'audit-2', action: 'updated', created_at: new Date() }
            ];

            db.query.mockResolvedValue({ rows: mockTrail });

            const trail = await auditService.getAuditTrail('lead-123', { limit: 50 });

            expect(trail).toEqual(mockTrail);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE lead_id = $1'),
                ['lead-123', 50]
            );
        });
    });
});
