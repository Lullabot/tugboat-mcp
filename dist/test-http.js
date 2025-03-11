"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const express_1 = __importDefault(require("express"));
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
const zod_1 = require("zod");
// Create a simple MCP server for testing
const server = new mcp_js_1.McpServer({
    name: "Tugboat MCP Test Server (HTTP)",
    version: "1.0.0",
    description: "Test server for Tugboat MCP using HTTP transport"
});
// Add a simple echo tool
server.tool("echo", {
    message: zod_1.z.string().describe("Message to echo back")
}, async ({ message }) => {
    return {
        content: [
            {
                type: "text",
                text: `Echo: ${message}`
            }
        ]
    };
});
// Add a simple resource
server.resource("hello", new mcp_js_1.ResourceTemplate("hello://{name}", { list: undefined }), async (uri, { name }) => {
    return {
        contents: [
            {
                uri: uri.href,
                metadata: {
                    title: `Hello ${name}`,
                    description: `A greeting for ${name}`
                },
                text: `Hello, ${name}!`
            }
        ]
    };
});
// Start the server with HTTP transport
async function main() {
    const app = (0, express_1.default)();
    const port = 3000;
    app.post("/mcp", async (req, res) => {
        const transport = new sse_js_1.SSEServerTransport("/mcp", res);
        await server.connect(transport);
    });
    app.listen(port, () => {
        console.log(`Test MCP server listening on http://localhost:${port}`);
    });
}
main().catch(error => {
    console.error("Error starting test server:", error);
    process.exit(1);
});
