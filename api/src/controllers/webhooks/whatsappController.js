const crypto = require('crypto');
const db = require('../../config/database');
const logger = require('../../utils/logger');
const { normalizeMessage } = require('../../utils/messageNormalizer');
const { generateAIReply } = require('../../services/ai/chatService');
const { sendWhatsAppMessage } = require('../../services/whatsapp/messageService');
const { checkCancellation } = require('../../utils/conditionalRouter');
const { subscribeToKlickTipp } = require('../../services/klicktipp/subscriberService');

/**
 * WhatsApp webhook signature validation
 */
exports.validateSignature = (req, res, next) => {
    const signature = req.headers['x-hub-signature-256'];
    const APP_SECRET = process.env.META_APP_SECRET;

    if (!signature || !APP_SECRET) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const payload = JSON.stringify(req.body);
    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', APP_SECRET)
        .update(payload)
        .digest('hex');

    if (signature !== expectedSignature) {
        logger.warn('Invalid WhatsApp signature');
        return res.status(403).json({ error: 'Invalid signature' });
    }

    next();
};

/**
 * GET /webhooks/whatsapp
 * Handle Meta verification challenge
 */
exports.handleChallenge = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        logger.info('WhatsApp webhook verified');
        res.status(200).send(challenge);
    } else {
        res.status(403).json({ error: 'Forbidden' });
    }
};

/**
 * POST /webhooks/whatsapp
 * Implements n8n Workflow 2 + 3 logic:
 * 1. Filter user messages (not automated)
 * 2. Check for cancellation (STOP keyword)
 * 3. Route to AI chat OR opt-out subscription
 */
exports.handleMessage = async (req, res) => {
    try {
        // Quick 200 response (Meta requires fast response)
        res.status(200).json({ success: true });

        const { entry } = req.body;
        if (!entry || !entry[0]) return;

        const changes = entry[0].changes;
        if (!changes || !changes[0]) return;

        const value = changes[0].value;
        const { messages, contacts } = value;

        // Filter: Only process user messages (matches "Filter user messages" node)
        if (!messages || !messages[0]) {
            logger.info('Skipping automated message');
            return;
        }

        const message = messages[0];
        const contact = contacts[0];
        const phoneNumber = message.from;
        const messageText = message.text?.body;

        if (!messageText) return;

        logger.info('WhatsApp message received', { phoneNumber, messageText });

        // Normalize and check for cancellation (matches "Cancellation check" switch node)
        const normalized = normalizeMessage(messageText);
        const cancellationStatus = checkCancellation(normalized);

        if (cancellationStatus === 'CANCEL') {
            // Branch 1: User wants to opt-out (matches "Subscribe number to opt-out")
            await subscribeToKlickTipp({ phoneNumber, action: 'opt-out' });
            logger.info('User opted out', { phoneNumber });
        } else {
            // Branch 0: Continue with AI chat (matches Workflow 2 full flow)
            await processAIChat({
                phoneNumber,
                messageText,
                contactName: contact.profile?.name
            });
        }

    } catch (error) {
        logger.error('WhatsApp webhook error', { error });
    }
};

/**
 * Process AI chat flow (Workflow 2)
 */
async function processAIChat({ phoneNumber, messageText, contactName }) {
    try {
        // Step 1: Get lead by phone
        const leadResult = await db.query(
            'SELECT * FROM leads WHERE phone_number = $1 LIMIT 1',
            [phoneNumber]
        );
        const lead = leadResult.rows[0];

        if (!lead) {
            logger.warn('Lead not found for phone', { phoneNumber });
            return;
        }

        // Step 2: Get campaign
        const campaignResult = await db.query(
            'SELECT * FROM campaigns WHERE user_id = $1 LIMIT 1',
            [lead.user_id]
        );
        const campaign = campaignResult.rows[0] || {};

        // Step 3: Generate AI reply with context
        const aiReply = await generateAIReply({
            userMessage: messageText,
            phoneNumber,
            leadContext: lead,
            campaignContext: campaign
        });

        // Step 4: Send WhatsApp reply
        await sendWhatsAppMessage({
            to: phoneNumber,
            message: aiReply
        });

        logger.info('AI reply sent', { phoneNumber });

    } catch (error) {
        logger.error('AI chat processing error', { error });
        // continueOnError - don't throw
    }
}
