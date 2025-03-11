"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const express_1 = __importDefault(require("express"));
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
// Import our resources and tools
const resources_1 = require("./resources");
const tools_1 = require("./tools");
const config_1 = require("./utils/config");
// Create an MCP server
const server = new mcp_js_1.McpServer({
    name: "Tugboat MCP Server",
    version: "1.0.0",
    description: "Model Context Protocol server for Tugboat API"
});
// Register resources and tools
(0, resources_1.registerResources)(server);
(0, tools_1.registerTools)(server);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Get configuration
        const config = (0, config_1.getConfig)();
        if (config.transportType === 'http') {
            // Start an HTTP server with Server-Sent Events
            const app = (0, express_1.default)();
            const port = config.port || 3000;
            app.post("/mcp", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const transport = new sse_js_1.SSEServerTransport("/mcp", res);
                yield server.connect(transport);
            }));
            app.listen(port, () => {
                console.log(`Tugboat MCP server listening on http://localhost:${port}`);
            });
        }
        else {
            // Default to stdio for compatibility with MCP clients like Claude Desktop
            const transport = new stdio_js_1.StdioServerTransport();
            yield server.connect(transport);
        }
    });
}
main().catch(error => {
    console.error("Error starting Tugboat MCP server:", error);
    process.exit(1);
});
