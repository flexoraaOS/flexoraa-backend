// Pinecone Vector Store Service
// Real implementation using @pinecone-database/pinecone
const { Pinecone } = require('@pinecone-database/pinecone');
const config = require('../../config/env');
const logger = require('../../utils/logger');
const geminiService = require('./geminiService');

class PineconeService {
    constructor() {
        this.enabled = config.ENABLE_PINECONE_RAG;
        this.apiKey = config.PINECONE_API_KEY;
        this.indexName = config.PINECONE_INDEX;
        this.client = null;
        this.index = null;

        if (this.enabled && this.apiKey) {
            try {
                this.client = new Pinecone({ apiKey: this.apiKey });
                this.index = this.client.index(this.indexName);
                logger.info({ index: this.indexName }, '🌲 Pinecone service initialized');
            } catch (error) {
                logger.error({ err: error }, 'Failed to initialize Pinecone client');
            }
        } else {
            logger.warn('Pinecone service disabled or missing API key');
        }
    }

    /**
     * Initialize/Check connection (for health check)
     */
    async initialize() {
        if (!this.enabled || !this.client) return false;
        try {
            // Lightweight check - describe index stats
            await this.index.describeIndexStats();
            return true;
        } catch (error) {
            logger.error({ err: error }, 'Pinecone health check failed');
            throw error;
        }
    }

    /**
     * Upsert vectors (store knowledge)
     * @param {Array} documents - [{ id, text, metadata }]
     */
    async upsert(documents) {
        if (!this.enabled || !this.index) {
            logger.info({ count: documents.length }, 'Pinecone upsert (stub)');
            return;
        }

        try {
            const vectors = [];

            // Generate embeddings for all docs
            for (const doc of documents) {
                const embedding = await geminiService.getEmbeddings(doc.text);
                vectors.push({
                    id: doc.id,
                    values: embedding,
                    metadata: {
                        ...doc.metadata,
                        text: doc.text, // Store text in metadata for retrieval
                    },
                });
            }

            // Batch upsert (Pinecone handles batching, but good to be explicit for large sets)
            await this.index.upsert(vectors);
            logger.info({ count: vectors.length }, 'Upserted vectors to Pinecone');
        } catch (error) {
            logger.error({ err: error }, 'Pinecone upsert failed');
            throw error;
        }
    }

    /**
     * Query knowledge base (RAG)
     * @param {Array} queryEmbedding - Vector to search for (optional, can generate from text)
     * @param {number} topK - Number of results
     * @param {Object} filter - Metadata filter (e.g. { tenantId: '...' })
     * @param {string} queryText - Text to search (if embedding not provided)
     */
    async query(queryEmbedding, topK = 3, filter = {}, queryText = null) {
        if (!this.enabled || !this.index) {
            // Stub response
            return {
                matches: [
                    {
                        id: 'stub_doc_1',
                        score: 0.95,
                        metadata: { text: 'This is a stub knowledge base article about Flexoraa.' },
                    },
                ],
            };
        }

        try {
            let vector = queryEmbedding;

            // Generate embedding if text provided
            if ((!vector || vector.length === 0) && queryText) {
                vector = await geminiService.getEmbeddings(queryText);
            }

            if (!vector || vector.length === 0) {
                throw new Error('No query vector or text provided');
            }

            const result = await this.index.query({
                vector,
                topK,
                filter,
                includeMetadata: true,
            });

            return result;
        } catch (error) {
            logger.error({ err: error }, 'Pinecone query failed');
            throw error;
        }
    }

    /**
     * Delete vectors by ID
     */
    async delete(ids) {
        if (!this.enabled || !this.index) return;
        await this.index.deleteMany(ids);
    }

    /**
     * Delete all vectors for a tenant
     */
    async deleteByTenant(tenantId) {
        if (!this.enabled || !this.index) return;
        // Delete by metadata filter (requires Pinecone serverless or pod-based with metadata support)
        try {
            await this.index.deleteMany({ tenantId: { $eq: tenantId } });
        } catch (error) {
            logger.error({ err: error, tenantId }, 'Failed to delete tenant vectors');
        }
    }
}

module.exports = new PineconeService();
