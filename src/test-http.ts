import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

// Create a simple MCP server for testing
const server = new McpServer({
  name: "Tugboat MCP Test Server (HTTP)",
  version: "1.0.0",
  description: "Test server for Tugboat MCP using HTTP transport"
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

// Start the server with HTTP transport
async function main() {
  const app = express();
  const port = 3000;
  
  app.post("/mcp", async (req, res) => {
    const transport = new SSEServerTransport("/mcp", res);
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