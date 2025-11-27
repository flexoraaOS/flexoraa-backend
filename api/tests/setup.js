// Test Setup
// Run before all tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_minimum_32_characters_long';
process.env.POSTGRES_PASSWORD = 'test_password';
process.env.LOG_LEVEL = 'silent'; // Suppress logs during tests

// Mock external services for tests
jest.mock('../src/services/ai/geminiService');
jest.mock('../src/services/ai/pineconeService');
jest.mock('../src/services/whatsapp/whatsappService');
jest.mock('../src/services/twilio/twilioService');
jest.mock('../src/services/klicktipp/klicktippService');
