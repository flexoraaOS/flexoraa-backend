// Consent Log Immutability Test
// Verifies that consent_log prevents UPDATE/DELETE operations
const db = require('../../../src/config/database');

describe('Consent Log Immutability', () => {
    let testConsentId;

    beforeAll(async () => {
        // Insert a test consent record
        const result = await db.query(
            `INSERT INTO consent_log (tenant_id, phone_number, consent_type, consent_status, consent_method)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
            ['00000000-0000-0000-0000-000000000001', '+910000000000', 'whatsapp_optin', 'granted', 'test']
        );
        testConsentId = result.rows[0].id;
    });

    it('should prevent UPDATE operations on consent_log', async () => {
        await expect(
            db.query(
                `UPDATE consent_log SET consent_status = 'revoked' WHERE id = $1`,
                [testConsentId]
            )
        ).rejects.toThrow(/append-only.*UPDATE.*not allowed/i);
    });

    it('should prevent DELETE operations on consent_log', async () => {
        await expect(
            db.query(
                `DELETE FROM consent_log WHERE id = $1`,
                [testConsentId]
            )
        ).rejects.toThrow(/append-only.*DELETE.*not allowed/i);
    });

    it('should allow INSERT operations (append-only)', async () => {
        const result = await db.query(
            `INSERT INTO consent_log (tenant_id, phone_number, consent_type, consent_status, consent_method)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
            ['00000000-0000-0000-0000-000000000001', '+919999999999', 'whatsapp_optin', 'granted', 'test']
        );

        expect(result.rows[0].id).toBeDefined();
    });
});
