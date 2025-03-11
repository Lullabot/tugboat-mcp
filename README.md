# Tugboat MCP Server

A Model Context Protocol (MCP) server for interacting with the Tugboat API. This server allows AI assistants like Claude to access and manipulate Tugboat resources through the standardized MCP interface.

## What is MCP?

The Model Context Protocol (MCP) is an open protocol created by Anthropic that enables seamless integration between AI assistants and external data sources or tools. It provides a standardized way for AI models to:

- Access resources (data and context)
- Use tools (functions to perform actions)
- Follow prompts (templated workflows)

This Tugboat MCP server implements the protocol to expose Tugboat's API capabilities to AI assistants like Claude.

## Features

- Access Tugboat projects, previews, and repositories
- Create, build, refresh, and delete previews
- Search for Tugboat resources
- View preview logs
- Support for both stdio and HTTP transports
- Authentication and authorization support

## Architecture

The server follows a modular architecture:

- **Core**: Main server setup and configuration management
- **Resources**: Exposes Tugboat entities as MCP resources
- **Tools**: Implements functions to interact with Tugboat API
- **Utils**: API client and configuration utilities
- **Auth**: Authentication and authorization management
- **Middleware**: HTTP request handling for authentication

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tugboat-mcp.git
cd tugboat-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Environment Variables

The following environment variables are required:

- `TUGBOAT_API_KEY`: Your Tugboat API key
- `TRANSPORT_TYPE`: The transport type to use (`stdio` or `http`, defaults to `stdio`)
- `PORT`: The port to use for HTTP transport (defaults to `3000`)
- `TUGBOAT_API_URL`: The base URL for the Tugboat API (defaults to `https://api.tugboatqa.com/v3`)

## Setting Up With Claude Desktop

### Configuration

1. Create or edit the Claude Desktop configuration file:

   **macOS**:
   ```bash
   touch "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
   open -e "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
   ```

   **Windows**:
   ```bash
   code %APPDATA%\Claude\claude_desktop_config.json
   ```

2. Add the Tugboat MCP server configuration:

   ```json
   {
     "mcpServers": {
       "tugboat-mcp": {
         "command": "node",
         "args": ["/path/to/tugboat-mcp/dist/index.js"],
         "env": {
           "TUGBOAT_API_KEY": "your-api-key-here"
         }
       }
     }
   }
   ```

3. Restart Claude Desktop

### Authentication in Claude Desktop

When using Claude Desktop, authentication is handled automatically through the `TUGBOAT_API_KEY` environment variable that you provide in the configuration. The stdio transport used by Claude Desktop doesn't require the explicit authentication steps that the HTTP transport does.

### Example Claude Interaction

Here's how you might interact with Tugboat through Claude:

1. Open Claude Desktop and start a new conversation.
2. You'll see a tools icon (hammer) in the bottom toolbar if the MCP server is properly configured.
3. Ask Claude to interact with Tugboat:

   ```
   Can you list my Tugboat projects?
   ```

   Claude will respond by using the MCP server to fetch and display your projects:

   ```
   I've found the following Tugboat projects:

   1. Website Redesign (ID: abc123)
      - Created: 2023-05-15
      - Previews: 7

   2. API Integration (ID: def456)
      - Created: 2023-08-20
      - Previews: 3

   Would you like to see details for any specific project?
   ```

4. You can then ask about specific projects or previews:

   ```
   Show me the previews for the Website Redesign project.
   ```

   Claude will use the MCP server to fetch and display the previews:

   ```
   Here are the previews for the Website Redesign project:

   1. Homepage Update (ID: prev789)
      - Status: Running
      - Created: 2023-09-10
      - URL: https://prev789.tugboatqa.com

   2. Nav Menu Fix (ID: prev012)
      - Status: Building
      - Created: 2023-09-15

   Would you like to see logs for any of these previews?
   ```

## Setting Up With Cursor

### Configuration

1. Open Cursor Settings
2. Navigate to Features > MCP Servers
3. Click on the "+ Add New MCP Server" button
4. Fill out the following information:
   - **Name**: Enter "tugboat-mcp"
   - **Type**: Select "command" as the type
   - **Command**: Enter the command to run the server:
     ```
     env TUGBOAT_API_KEY=your-api-key-here node /path/to/tugboat-mcp/dist/index.js
     ```

### Authentication in Cursor

Like Claude Desktop, Cursor handles authentication automatically through the environment variables provided in the configuration. The MCP server uses the `TUGBOAT_API_KEY` to authenticate with the Tugboat API.

### Example Cursor Interaction

Here's how to use the Tugboat MCP server with Cursor:

1. Open Cursor and navigate to your project.
2. Press `Cmd+L` (Mac) or `Ctrl+L` (Windows/Linux) to open the AI panel.
3. In the top right of the AI panel, make sure "Agent" is selected.
4. Ask Cursor to interact with Tugboat:

   ```
   Can you create a new preview in my Tugboat repository def456 using the branch "feature/new-button" and name it "Button Feature Test"?
   ```

   Cursor will respond by using the MCP server to create the preview:

   ```
   I'll create a new preview for you in repository def456.

   I've created a preview named "Button Feature Test" using the branch "feature/new-button". 
   
   Preview ID: prev345
   Status: Building
   
   The preview will be available at https://prev345.tugboatqa.com once the build is complete.
   
   Would you like me to check the build status or perform any other actions with Tugboat?
   ```

5. You can continue the conversation by asking Cursor to perform other Tugboat operations.

## Using the HTTP Transport Directly

You can also run the server with HTTP transport and interact with it directly:

```bash
# Start the server with HTTP transport
TUGBOAT_API_KEY=your-api-key TRANSPORT_TYPE=http npm start
```

### Authentication with HTTP Transport

When using the HTTP transport, you need to authenticate explicitly:

1. Get an authentication token:
   ```bash
   curl -X POST http://localhost:3000/auth/login
   ```
   
   Response:
   ```json
   {
     "success": true,
     "token": "your-tugboat-api-key"
   }
   ```

2. Use the token to access the MCP endpoint:
   ```bash
   curl -X POST http://localhost:3000/mcp \
     -H "Authorization: Bearer your-tugboat-api-key" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
   ```

## Available Resources

| Resource URI | Description |
| --- | --- |
| `tugboat://projects` | List all projects |
| `tugboat://project/{id}` | Get details for a specific project |
| `tugboat://previews` | List all previews |
| `tugboat://preview/{id}` | Get details for a specific preview |
| `tugboat://preview/{id}/logs` | Get logs for a specific preview |
| `tugboat://repositories` | List all repositories |
| `tugboat://repository/{id}` | Get details for a specific repository |

## Available Tools

### Projects

| Tool | Description | Parameters |
| --- | --- | --- |
| `listProjects` | List all projects | - |
| `getProject` | Get details of a specific project | `id` |
| `updateProject` | Update a project's settings | `id`, `name` (optional), `domain` (optional) |
| `deleteProject` | Delete a project | `id`, `confirm` |
| `getProjectRepos` | Get repositories for a project | `id` |
| `getProjectJobs` | Get jobs for a project | `id`, `children` (optional), `limit` (optional) |
| `getProjectStats` | Get statistics for a project | `id`, `item`, `after` (optional), `before` (optional), `limit` (optional) |
| `searchProjects` | Search for projects | `query` |

### Previews

| Tool | Description | Parameters |
| --- | --- | --- |
| `createPreview` | Create a new preview | `repo`, `ref`, `name` (optional), `config` (optional) |
| `buildPreview` | Build a preview | `previewId` |
| `refreshPreview` | Refresh a preview | `previewId` |
| `deletePreview` | Delete a preview | `previewId` |
| `getPreview` | Get details of a specific preview | `previewId` |
| `updatePreview` | Update a preview's settings | `previewId`, `name` (optional), `locked` (optional), `anchor` (optional), `anchor_type` (optional), `config` (optional) |
| `getPreviewJobs` | Get jobs for a preview | `previewId`, `active` (optional) |
| `getPreviewStatistics` | Get statistics for a preview | `previewId`, `item`, `limit` (optional), `before` (optional), `after` (optional) |
| `clonePreview` | Clone a preview | `previewId`, `name` (optional), `expires` (optional) |
| `startPreview` | Start a preview | `previewId` |
| `stopPreview` | Stop a preview | `previewId` |
| `suspendPreview` | Suspend a preview | `previewId` |
| `searchPreviews` | Search for previews | `query`, `state` (optional) |

### Repositories

| Tool | Description | Parameters |
| --- | --- | --- |
| `createRepository` | Create a new repository | `project`, `provider`, `repository`, `auth` (optional), plus multiple optional settings |
| `getRepository` | Get details of a specific repository | `id` |
| `updateRepository` | Update a repository's settings | `id`, plus multiple optional settings |
| `deleteRepository` | Delete a repository | `id`, `confirm` |
| `updateRepositoryAuth` | Update provider authentication for a repository | `id`, `auth` |
| `getRepositoryPreviews` | Get previews for a repository | `id` |
| `getRepositoryBranches` | Get branches for a repository | `id` |
| `getRepositoryTags` | Get tags for a repository | `id` |
| `getRepositoryPullRequests` | Get pull requests for a repository | `id` |
| `getRepositoryJobs` | Get jobs for a repository | `id`, `action` (optional), `children` (optional), `limit` (optional) |
| `getRepositoryRegistries` | Get Docker registries for a repository | `id` |
| `getRepositoryStats` | Get statistics for a repository | `id`, `item`, `after` (optional), `before` (optional), `limit` (optional) |
| `createRepositorySSHKey` | Generate new SSH key for a repository | `id`, `type` (optional), `bits` (optional) |

## Example Prompts

### List available Tugboat projects

```
What Tugboat projects do I have access to?
```

### Create a new preview

```
Create a new preview in repository 5f7c8d9e3b2a1c0e7f6d5a4b named "feature-branch-test" using the "feature/new-homepage" branch.
```

### Check preview logs

```
Show me the logs for preview 3a2b1c0d9e8f7g6h5i4j.
```

### Get project details

```
Show me the details for project 5d810c19f6f8203d5b65ef01.
```

### Update a project

```
Update the name of project 5d810c19f6f8203d5b65ef01 to "Website Redesign 2.0".
```

### List project repositories

```
What repositories belong to project 5d810c19f6f8203d5b65ef01?
```

### View project statistics

```
Get the size statistics for project 5d810c19f6f8203d5b65ef01 from the last 30 days.
```

### Create a repository

```
Create a new GitHub repository for the TugboatQA/demo project in project 5d810c19f6f8203d5b65ef01 using my personal access token ghp_abc123.
```

### Get repository details

```
Show me the details for repository 5d810c19f6f82083ed65ef03.
```

### Update repository settings

```
Update repository 5d810c19f6f82083ed65ef03 to enable autorebuild and autoredeploy.
```

### List repository branches

```
What branches are available in repository 5d810c19f6f82083ed65ef03?
```

### View repository previews

```
Show me all the previews for repository 5d810c19f6f82083ed65ef03.
```

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test
```

## Project Structure

```
tugboat-mcp/
├── src/
│   ├── index.ts              # Main entry point
│   ├── resources/            # MCP resources implementation
│   │   └── index.ts          # Resource registration
│   ├── tools/                # MCP tools implementation
│   │   └── index.ts          # Tool registration
│   ├── middleware/           # HTTP middleware
│   │   └── auth.ts           # Authentication middleware
│   ├── utils/                # Utility functions
│   │   ├── api-client.ts     # Tugboat API client
│   │   ├── auth.ts           # Authentication utilities
│   │   ├── config.ts         # Configuration management
│   │   └── openapi.yaml      # Tugboat API specification
│   ├── test.ts               # Test script for stdio transport
│   └── test-http.ts          # Test script for HTTP transport
├── dist/                     # Compiled JavaScript files
├── node_modules/             # Node.js dependencies
├── package.json              # Project metadata and dependencies
├── tsconfig.json             # TypeScript configuration
├── README.md                 # Project documentation
└── TODO.md                   # Task list and progress tracking
```

## Contributing

Contributions are welcome! See the TODO.md file for areas that need work.

## License

MIT 

## Testing

The server includes a comprehensive test suite to ensure its functionality works correctly. The tests are written using Jest and include unit tests for authentication, API client, and other components.

### Running Tests

To run the tests, use the following command:

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

The tests are organized in the `tests` directory with the following structure:

- `auth.test.ts` - Tests for the authentication manager and middleware
- `api-client.test.ts` - Tests for the Tugboat API client
- More test files will be added as functionality expands

### Adding New Tests

When adding new functionality, please add corresponding tests to ensure code quality and prevent regressions. Test files should follow the naming convention `[component].test.ts`. 