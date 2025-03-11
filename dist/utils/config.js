"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
/**
 * Get the configuration for the Tugboat MCP server from environment variables
 */
function getConfig() {
    const apiKey = process.env.TUGBOAT_API_KEY || '';
    if (!apiKey) {
        throw new Error('TUGBOAT_API_KEY environment variable must be set');
    }
    return {
        apiKey,
        baseUrl: process.env.TUGBOAT_API_URL || 'https://api.tugboatqa.com/v3',
        transportType: process.env.TRANSPORT_TYPE || 'stdio',
        port: parseInt(process.env.PORT || '3000', 10)
    };
}
