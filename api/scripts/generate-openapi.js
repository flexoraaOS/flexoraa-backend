const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Flexoraa Production Backend API',
            version: '1.0.0',
            description: 'Complete API specification for Flexoraa n8n replacement backend',
            contact: {
                name: 'Flexoraa Team',
                email: 'api@flexoraa.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:4000',
                description: 'Development server'
            },
            {
                url: 'https://api-staging.flexoraa.com',
                description: 'Staging server'
            },
            {
                url: 'https://api.flexoraa.com',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Lead: {
                    type: 'object',
                    required: ['phone_number'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string', nullable: true },
                        user_id: { type: 'string', format: 'uuid', nullable: true },
                        phone_number: { type: 'string', pattern: '^\\+91[0-9]{10}$' },
                        email: { type: 'string', format: 'email', nullable: true },
                        tags: { type: 'string', nullable: true },
                        status: { type: 'string', enum: ['pending', 'contacted', 'qualified', 'converted', 'lost'] },
                        message: { type: 'string', nullable: true },
                        temperature: { type: 'string', enum: ['HOT', 'WARM', 'COLD', 'natural'] },
                        campaign_id: { type: 'string', format: 'uuid', nullable: true },
                        metadata: { type: 'object', nullable: true },
                        has_whatsapp: { type: 'boolean', nullable: true },
                        conversation_score: { oneOf: [{ type: 'string' }, { type: 'number' }] },
                        followup_date: { type: 'string', format: 'date', nullable: true },
                        followup_time: { type: 'string', nullable: true },
                        closed: { type: 'boolean' },
                        contacted: { type: 'boolean' },
                        booked_timestamp: { type: 'string', format: 'date-time', nullable: true },
                        stage: { type: 'string', enum: ['new', 'contacted', 'qualified', 'booked', 'converted', 'lost'] },
                        note: { type: 'string', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                Campaign: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        user_id: { type: 'string', format: 'uuid', nullable: true },
                        name: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        start_date: { type: 'string', format: 'date', nullable: true },
                        end_date: { type: 'string', format: 'date', nullable: true },
                        status: { type: 'string', enum: ['draft', 'active', 'paused', 'archived'] },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                LeadScore: {
                    type: 'object',
                    properties: {
                        score: { type: 'number', minimum: 0, maximum: 100 },
                        category: { type: 'string', enum: ['HOT', 'WARM', 'COLD'] },
                        breakdown: {
                            type: 'object',
                            properties: {
                                deterministic: {
                                    type: 'object',
                                    properties: {
                                        score: { type: 'number' },
                                        maxScore: { type: 'number' },
                                        explanations: { type: 'array', items: { type: 'string' } }
                                    }
                                },
                                ai: {
                                    type: 'object',
                                    properties: {
                                        score: { type: 'number' },
                                        maxScore: { type: 'number' },
                                        explanation: { type: 'string' }
                                    }
                                }
                            }
                        },
                        scoredAt: { type: 'string', format: 'date-time' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        details: { type: 'array', items: { type: 'object' } }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./src/routes/*.js'] // Path to route files with JSDoc comments
};

const specs = swaggerJsdoc(options);

// Write to file
const outputPath = path.join(__dirname, '..', '..', 'openapi.yaml');
const yaml = require('js-yaml');
const yamlStr = yaml.dump(specs);

fs.writeFileSync(outputPath, yamlStr, 'utf8');
console.log(`✅ OpenAPI spec generated: ${outputPath}`);

module.exports = specs;
