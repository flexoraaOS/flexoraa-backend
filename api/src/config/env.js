// Environment Configuration Loader
// Uses Zod for validation
require('dotenv').config({ path: '../.env' });
const { z } = require('zod');

// Schema for environment variables
const envSchema = z.object({
  // Node
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),

  // Database
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.string().transform(Number).default('5432'),
  POSTGRES_DB: z.string().default('flexoraa'),
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string().default('1h'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Feature Flags (Phase 1 - all false for stubs)
  ENABLE_AI_SERVICES: z.string().transform(v => v === 'true').default('false'),
  ENABLE_WHATSAPP_SENDING: z.string().transform(v => v === 'true').default('false'),
  ENABLE_TWILIO_CALLING: z.string().transform(v => v === 'true').default('false'),
  ENABLE_KLICKTIPP_INTEGRATION: z.string().transform(v => v === 'true').default('false'),
  ENABLE_PINECONE_RAG: z.string().transform(v => v === 'true').default('false'),

  // External Services (optional in Phase 1)
  GEMINI_API_KEY: z.string().optional(),
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_INDEX: z.string().default('flexoraa-knowledge-base'),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID_PRIMARY: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID_SECONDARY: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID_SUPPORT: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  TWILIO_TWIML_URL: z.string().optional(),
  KLICKTIPP_USERNAME: z.string().optional(),
  KLICKTIPP_PASSWORD: z.string().optional(),
});

// Parse and validate
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Environment validation failed:', error.errors);
    process.exit(1);
  }
};

module.exports = parseEnv();
