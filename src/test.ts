import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create a simple MCP server for testing
const server = new McpServer({
  name: "Tugboat MCP Test Server",
  version: "1.0.0",
  description: "Test server for Tugboat MCP"
});

// Add a simple echo tool
server.tool(
  "echo",
  {
    message: z.string().describe("Message to echo back")
  },
  async ({ message }) => {
    return {
      content: [
        {
          type: "text",
          text: `Echo: ${message}`
        }
      ]
    };
  }
);

// Add a simple resource
server.resource(
  "hello",
  new ResourceTemplate("hello://{name}", { list: undefined }),
  async (uri, { name }) => {
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
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(error => {
  console.error("Error starting test server:", error);
  process.exit(1);
}); 