/**
 * Configuration for the Tugboat MCP server
 */
export interface TugboatMcpConfig {
  /**
   * The Tugboat API key to use for authentication
   */
  apiKey: string;
  
  /**
   * The base URL for the Tugboat API (defaults to production API)
   */
  baseUrl: string;
  
  /**
   * The transport type to use for the MCP server (stdio or http)
   */
  transportType: 'stdio' | 'http';
  
  /**
   * The port to use for HTTP transport (defaults to 3000)
   */
  port?: number;
}

/**
 * Get the configuration for the Tugboat MCP server from environment variables
 */
export function getConfig(): TugboatMcpConfig {
  const apiKey = process.env.TUGBOAT_API_KEY || '';
  if (!apiKey) {
    throw new Error('TUGBOAT_API_KEY environment variable must be set');
  }
  
  return {
    apiKey,
    baseUrl: process.env.TUGBOAT_API_URL || 'https://api.tugboatqa.com/v3',
    transportType: (process.env.TRANSPORT_TYPE as 'stdio' | 'http') || 'stdio',
    port: parseInt(process.env.PORT || '3000', 10)
  };
} 