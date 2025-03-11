import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import cors from "cors";
import fs from "fs";
import path from "path";

// Import our resources and tools
import { registerResources } from "./resources";
import { registerTools } from "./tools";
import { getConfig } from "./utils/config";
import { TugboatApiClient } from "./utils/api-client";
import { AuthManager } from "./utils/auth";
import { createAuthMiddleware } from "./middleware/auth";

// Setup logging to file for stdio mode
const logFile = path.join(__dirname, "../logs/mcp.log");
const logDir = path.dirname(logFile);

// Create log directory if it doesn't exist
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (err) {
  // Fall back to temp directory if we can't create our log directory
  console.error(`Could not create log directory: ${err}`);
}

// Custom logger that respects transport type
function createLogger(transportType: 'stdio' | 'http') {
  return {
    log: (message: string) => {
      if (transportType === 'http') {
        console.log(message);
      } else {
        try {
          fs.appendFileSync(logFile, `${new Date().toISOString()} [INFO] ${message}\n`);
        } catch (err) {
          // Silent failure for logging
        }
      }
    },
    error: (message: string) => {
      if (transportType === 'http') {
        console.error(message);
      } else {
        try {
          fs.appendFileSync(logFile, `${new Date().toISOString()} [ERROR] ${message}\n`);
        } catch (err) {
          // Silent failure for logging
        }
      }
    }
  };
}

async function main() {
  // Get configuration
  const config = getConfig();
  
  // Create logger
  const logger = createLogger(config.transportType);
  
  logger.log(`Starting Tugboat MCP server with transport: ${config.transportType}`);

  // Create API client with debug mode enabled (only for HTTP transport)
  const apiClient = new TugboatApiClient(
    config.apiKey, 
    config.baseUrl, 
    config.transportType === 'http' // only enable debug mode for HTTP
  );
  
  // Create authentication manager
  const authManager = new AuthManager(apiClient);
  
  // Create an MCP server
  const server = new McpServer({
    name: "Tugboat MCP Server",
    version: "1.0.0",
    description: "Model Context Protocol server for Tugboat API"
  });

  // Register resources and tools
  registerResources(server, logger);
  registerTools(server, logger);
  
  if (config.transportType === 'http') {
    // Start an HTTP server with Server-Sent Events
    const app = express();
    const port = config.port || 3000;
    
    // Enable CORS
    app.use(cors());
    
    // Parse JSON bodies
    app.use(express.json());
    
    // Authentication routes
    app.post("/auth/login", async (req, res) => {
      try {
        // In a real application, you'd validate credentials here
        // For this implementation, we just use the API key authentication
        const token = await authManager.authenticate();
        
        res.json({
          success: true,
          token: token.token,
          expires: token.expires
        });
      } catch (error) {
        logger.error('Authentication error: ' + error);
        res.status(401).json({
          success: false,
          error: 'Authentication failed'
        });
      }
    });
    
    // Create authentication middleware
    const authMiddleware = createAuthMiddleware(authManager);
    
    // Apply authentication middleware to protected routes
    app.use("/mcp", authMiddleware);
    
    // Debugging endpoint for previews
    app.get("/debug/previews", async (req, res) => {
      try {
        logger.log("Debugging previews endpoint called");
        const previews = await apiClient.get('/previews');
        res.json(previews);
      } catch (error: any) {
        logger.error("Error fetching previews: " + error);
        res.status(500).json({
          success: false,
          error: error.message || 'Unknown error occurred'
        });
      }
    });
    
    // MCP endpoint
    app.post("/mcp", async (req, res) => {
      const transport = new SSEServerTransport("/mcp", res);
      await server.connect(transport);
    });
    
    // Start HTTP server
    app.listen(port, () => {
      logger.log(`Tugboat MCP server listening on http://localhost:${port}`);
      logger.log(`Authentication endpoint: http://localhost:${port}/auth/login`);
      logger.log(`MCP endpoint: http://localhost:${port}/mcp`);
      logger.log(`Debug endpoint: http://localhost:${port}/debug/previews`);
    });
  } else {
    // Default to stdio for compatibility with MCP clients like Claude Desktop
    logger.log("Using stdio transport - all further logs will go to file only");
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

main().catch(error => {
  // For fatal errors, we need to write to stderr no matter what
  console.error("Fatal error starting Tugboat MCP server:", error);
  process.exit(1);
}); 