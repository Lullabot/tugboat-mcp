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
}, (_a) => __awaiter(void 0, [_a], void 0, function* ({ message }) {
    return {
        content: [
            {
                type: "text",
                text: `Echo: ${message}`
            }
        ]
    };
}));
// Add a simple resource
server.resource("hello", new mcp_js_1.ResourceTemplate("hello://{name}", { list: undefined }), (uri_1, _a) => __awaiter(void 0, [uri_1, _a], void 0, function* (uri, { name }) {
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
}));
// Start the server
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const transport = new stdio_js_1.StdioServerTransport();
        yield server.connect(transport);
    });
}
main().catch(error => {
    console.error("Error starting test server:", error);
    process.exit(1);
});
