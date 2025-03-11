"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const express_1 = __importDefault(require("express"));
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Import our resources and tools
const resources_1 = require("./resources");
const tools_1 = require("./tools");
const config_1 = require("./utils/config");
const api_client_1 = require("./utils/api-client");
const auth_1 = require("./utils/auth");
const auth_2 = require("./middleware/auth");
// Setup logging to file for stdio mode
const logFile = path_1.default.join(__dirname, "../logs/mcp.log");
const logDir = path_1.default.dirname(logFile);
// Create log directory if it doesn't exist
try {
    if (!fs_1.default.existsSync(logDir)) {
        fs_1.default.mkdirSync(logDir, { recursive: true });
    }
}
catch (err) {
    // Fall back to temp directory if we can't create our log directory
    console.error(`Could not create log directory: ${err}`);
}
// Custom logger that respects transport type
function createLogger(transportType) {
    return {
        log: (message) => {
            if (transportType === 'http') {
                console.log(message);
            }
            else {
                try {
                    fs_1.default.appendFileSync(logFile, `${new Date().toISOString()} [INFO] ${message}\n`);
                }
                catch (err) {
                    // Silent failure for logging
                }
            }
        },
        error: (message) => {
            if (transportType === 'http') {
                console.error(message);
            }
            else {
                try {
                    fs_1.default.appendFileSync(logFile, `${new Date().toISOString()} [ERROR] ${message}\n`);
                }
                catch (err) {
                    // Silent failure for logging
                }
            }
        }
    };
}
async function main() {
    // Get configuration
    const config = (0, config_1.getConfig)();
    // Create logger
    const logger = createLogger(config.transportType);
    logger.log(`Starting Tugboat MCP server with transport: ${config.transportType}`);
    // Create API client with debug mode enabled (only for HTTP transport)
    const apiClient = new api_client_1.TugboatApiClient(config.apiKey, config.baseUrl, config.transportType === 'http' // only enable debug mode for HTTP
    );
    // Create authentication manager
    const authManager = new auth_1.AuthManager(apiClient);
    // Create an MCP server
    const server = new mcp_js_1.McpServer({
        name: "Tugboat MCP Server",
        version: "1.0.0",
        description: "Model Context Protocol server for Tugboat API"
    });
    // Register resources and tools
    (0, resources_1.registerResources)(server, logger);
    (0, tools_1.registerTools)(server, logger);
    if (config.transportType === 'http') {
        // Start an HTTP server with Server-Sent Events
        const app = (0, express_1.default)();
        const port = config.port || 3000;
        // Enable CORS
        app.use((0, cors_1.default)());
        // Parse JSON bodies
        app.use(express_1.default.json());
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
            }
            catch (error) {
                logger.error('Authentication error: ' + error);
                res.status(401).json({
                    success: false,
                    error: 'Authentication failed'
                });
            }
        });
        // Create authentication middleware
        const authMiddleware = (0, auth_2.createAuthMiddleware)(authManager);
        // Apply authentication middleware to protected routes
        app.use("/mcp", authMiddleware);
        // Debugging endpoint for previews
        app.get("/debug/previews", async (req, res) => {
            try {
                logger.log("Debugging previews endpoint called");
                const previews = await apiClient.get('/previews');
                res.json(previews);
            }
            catch (error) {
                logger.error("Error fetching previews: " + error);
                res.status(500).json({
                    success: false,
                    error: error.message || 'Unknown error occurred'
                });
            }
        });
        // MCP endpoint
        app.post("/mcp", async (req, res) => {
            const transport = new sse_js_1.SSEServerTransport("/mcp", res);
            await server.connect(transport);
        });
        // Start HTTP server
        app.listen(port, () => {
            logger.log(`Tugboat MCP server listening on http://localhost:${port}`);
            logger.log(`Authentication endpoint: http://localhost:${port}/auth/login`);
            logger.log(`MCP endpoint: http://localhost:${port}/mcp`);
            logger.log(`Debug endpoint: http://localhost:${port}/debug/previews`);
        });
    }
    else {
        // Default to stdio for compatibility with MCP clients like Claude Desktop
        logger.log("Using stdio transport - all further logs will go to file only");
        const transport = new stdio_js_1.StdioServerTransport();
        await server.connect(transport);
    }
}
main().catch(error => {
    // For fatal errors, we need to write to stderr no matter what
    console.error("Fatal error starting Tugboat MCP server:", error);
    process.exit(1);
});
