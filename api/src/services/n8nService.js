const axios = require('axios');

class N8NService {
    constructor() {
        this.baseURL = process.env.N8N_BASE_URL || 'http://localhost:5678';
        this.apiKey = process.env.N8N_API_KEY;

        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'X-N8N-API-KEY': this.apiKey,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
    }

    /**
     * Trigger a workflow execution
     */
    async triggerWorkflow(workflowId, data) {
        try {
            const response = await this.client.post(
                `/webhook/${workflowId}`,
                data
            );
            return {
                success: true,
                executionId: response.data.executionId,
                data: response.data,
            };
        } catch (error) {
            console.error('N8N workflow trigger failed:', error.message);
            throw new Error(`Failed to trigger workflow: ${error.message}`);
        }
    }

    /**
     * Get workflow execution status
     */
    async getExecutionStatus(executionId) {
        try {
            const response = await this.client.get(`/executions/${executionId}`);
            return {
                id: response.data.id,
                status: response.data.finished ? 'completed' : 'running',
                startedAt: response.data.startedAt,
                stoppedAt: response.data.stoppedAt,
                data: response.data,
            };
        } catch (error) {
            console.error('Failed to get execution status:', error.message);
            throw new Error(`Failed to get execution status: ${error.message}`);
        }
    }

    /**
     * Get workflow execution logs
     */
    async getExecutionLogs(executionId) {
        try {
            const response = await this.client.get(`/executions/${executionId}`);
            return response.data;
        } catch (error) {
            console.error('Failed to get execution logs:', error.message);
            throw new Error(`Failed to get execution logs: ${error.message}`);
        }
    }

    /**
     * Test n8n connection
     */
    async testConnection() {
        try {
            await this.client.get('/healthz');
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = new N8NService();
