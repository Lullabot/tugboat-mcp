"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
// Create a simple MCP server for testing
const server = new mcp_js_1.McpServer({
    name: "Tugboat MCP Test Server",
    version: "1.0.0",
    description: "Test server for Tugboat MCP"
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
// Start the server
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
main().catch(error => {
    console.error("Error starting test server:", error);
    process.exit(1);
});
