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

console.log('✅ Local test environment initialized - All external services mocked');
