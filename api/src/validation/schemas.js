// Validation Schemas
// Zod schemas for request validation matching frontend types
const { z } = require('zod');

// Lead Validation
const LeadStatus = z.enum(['pending', 'contacted', 'qualified', 'converted', 'lost']);
const LeadStages = z.enum(['new', 'contacted', 'qualified', 'booked', 'converted', 'lost']);
const LeadTemperature = z.enum(['HOT', 'WARM', 'COLD', 'natural']);

const createLeadSchema = z.object({
    phone_number: z.string().regex(/^\+91[0-9]{10}$/, 'Phone number must be +91 followed by 10 digits'),
    name: z.string().optional(),
    campaign_id: z.string().uuid().optional().nullable(),
    email: z.string().email().optional().nullable(),
    tags: z.string().optional().nullable(),
    message: z.string().optional().nullable(),
    metadata: z.record(z.any()).optional().nullable(),
    has_whatsapp: z.boolean().optional().nullable(),
    stage: LeadStages.optional(),
    status: LeadStatus.optional()
});

const updateLeadSchema = z.object({
    name: z.string().optional(),
    phone_number: z.string().regex(/^\+91[0-9]{10}$/).optional(),
    email: z.string().email().optional().nullable(),
    tags: z.string().optional().nullable(),
    status: LeadStatus.optional(),
    message: z.string().optional().nullable(),
    temperature: LeadTemperature.optional(),
    campaign_id: z.string().uuid().optional().nullable(),
    metadata: z.record(z.any()).optional().nullable(),
    has_whatsapp: z.boolean().optional(),
    conversation_score: z.union([z.string(), z.number()]).optional(),
    followup_date: z.string().optional().nullable(),
    followup_time: z.string().optional().nullable(),
    closed: z.boolean().optional(),
    contacted: z.boolean().optional(),
    booked_timestamp: z.string().datetime().optional().nullable(),
    stage: LeadStages.optional(),
    note: z.string().optional().nullable()
});

// Campaign Validation
const CampaignStatus = z.enum(['draft', 'active', 'paused', 'archived']);

const createCampaignSchema = z.object({
    name: z.string().min(1, 'Campaign name is required'),
    description: z.string().optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    status: CampaignStatus.optional()
});

const updateCampaignSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    status: CampaignStatus.optional()
});

// Validation middleware factory
const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors.map(e => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                });
            }
            next(error);
        }
    };
};

module.exports = {
    createLeadSchema,
    updateLeadSchema,
    createCampaignSchema,
    updateCampaignSchema,
    validate
};
