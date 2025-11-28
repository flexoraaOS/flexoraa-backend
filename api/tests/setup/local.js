/**
 * Local Test Setup - Mocks all external services
 * Run tests without any API credentials
 */

// Set environment variables for local testing
process.env.NODE_ENV = 'test';
process.env.LOCAL_MODE = 'true';
process.env.LOG_LEVEL = 'silent';

// Mock credentials (not real, just for validation)
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-required-for-validation';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-minimum-32-characters';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.SUPABASE_URL = 'https://mock.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'mock-service-key';

// Mock API keys (not real)
process.env.OPENAI_API_KEY = 'mock-openai-api-key';
process.env.PINECONE_API_KEY = 'mock-pinecone-api-key';
process.env.PINECONE_ENVIRONMENT = 'mock-env';
process.env.PINECONE_INDEX = 'mock-index';
process.env.TWILIO_ACCOUNT_SID = 'mock-twilio-sid';
process.env.TWILIO_AUTH_TOKEN = 'mock-twilio-token';
process.env.TWILIO_PHONE_NUMBER = '+15555551234';
// Mock Pinecone
jest.mock('@pinecone-database/pinecone', () => ({
    Pinecone: jest.fn().mockImplementation(() => ({
        Index: jest.fn().mockReturnValue({
            query: jest.fn().mockResolvedValue({
                matches: [
                    {
                        id: 'doc1',
                        score: 0.95,
                        metadata: { text: 'Mock RAG result: Product pricing information' }
                    }
                ]
            }),
            upsert: jest.fn().mockResolvedValue({ upsertedCount: 1 })
        })
    }))
}));

// Mock Twilio
jest.mock('twilio', () => {
    return jest.fn().mockImplementation(() => ({
        messages: {
            create: jest.fn().mockResolvedValue({
                sid: 'mock-message-sid',
                status: 'queued',
                to: '+15555555555'
            })
        }
    }));
});

// Mock Axios (for WhatsApp/KlickTipp)
jest.mock('axios', () => ({
    create: jest.fn(() => ({
        post: jest.fn().mockResolvedValue({
            data: { success: true, messageId: 'mock-whatsapp-id' }
        }),
        get: jest.fn().mockResolvedValue({
            data: { subscribers: [] }
        })
    })),
    post: jest.fn().mockResolvedValue({
        data: { success: true }
    }),
    get: jest.fn().mockResolvedValue({
        data: { success: true }
    })
}));

// Mock pg (PostgreSQL) - use in-memory fallback
jest.mock('pg', () => {
    const mockPool = {
        query: jest.fn().mockImplementation((query) => {
            // Mock common queries
            if (query.includes('SELECT') && query.includes('leads')) {
                return Promise.resolve({
                    rows: [
                        { id: '1', name: 'Test Lead', email: 'test@example.com', status: 'new' }
                    ]
                });
            }
            if (query.includes('INSERT')) {
                return Promise.resolve({
                    rows: [{ id: 'new-id-123' }]
                });
            }
            return Promise.resolve({ rows: [] });
        }),
        connect: jest.fn().mockResolvedValue({}),
        end: jest.fn().mockResolvedValue({})
    };

    return {
        Pool: jest.fn(() => mockPool)
    };
});

console.log('✅ Local test environment initialized - All external services mocked (OpenAI ChatGPT)');
