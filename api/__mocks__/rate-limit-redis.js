const RedisStore = jest.fn().mockImplementation(() => ({
    increment: jest.fn().mockResolvedValue({ totalHits: 1, resetTime: Date.now() + 60000 }),
    decrement: jest.fn(),
    resetKey: jest.fn()
}));

module.exports = {
    RedisStore
};
