import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TugboatApiClient } from "../utils/api-client";
import { AuthManager } from "../utils/auth";
import { registerPreviewTools } from "./previews";
import { registerProjectTools } from "./projects";
import { registerRepositoryTools } from "./repositories";
import { registerSearchTools } from "./search";

// Logger interface
interface Logger {
  log: (message: string) => void;
  error: (message: string) => void;
}

/**
 * Register all tools with the MCP server
 */
export function registerTools(server: McpServer, config: any, logger: Logger) {
  // Initialize configurations
  const apiClient = new TugboatApiClient(config);
  const authManager = new AuthManager(config);
  
  // Register all tool groups
  registerPreviewTools(server, apiClient, authManager, logger);
  registerSearchTools(server, apiClient, authManager, logger);
  registerProjectTools(server, apiClient, authManager, logger);
  registerRepositoryTools(server, apiClient, authManager, logger);
  
  logger.log("Registered all Tugboat tools");
} 