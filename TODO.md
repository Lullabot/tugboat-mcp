# Tugboat MCP Server - TODO List

## Project Setup and Infrastructure

- [x] Initialize Node.js/TypeScript project
- [x] Set up necessary dependencies
- [x] Configure TypeScript
- [x] Create basic directory structure
- [x] Set up build scripts

## Core MCP Implementation

- [x] Create main server entry point
- [x] Implement configuration management
- [x] Add support for both stdio and HTTP transports
- [x] Create API client for Tugboat API
- [x] Set up error handling
- [x] Add support for authentication/authorization

## Resources

- [x] Implement Project resources
  - [x] List all projects
  - [x] Get single project details
- [x] Implement Preview resources
  - [x] List all previews
  - [x] Get single preview details
  - [x] Get preview logs
- [x] Implement Repository resources
  - [x] List all repositories
  - [x] Get single repository details

## Tools

- [x] Implement Preview management tools
  - [x] Create preview
  - [x] Build preview
  - [x] Refresh preview
  - [x] Delete preview
- [x] Implement Search tools
  - [x] Search for previews
  - [x] Search for projects
- [ ] Reorganize tools into separate files by API endpoint
  - [ ] Create dedicated files (previews.ts, projects.ts, repositories.ts)
  - [ ] Move tools to appropriate files
  - [ ] Update imports/exports
  - [ ] Add file-level documentation
  - [ ] Update tests to match new structure

## Testing

- [x] Create basic test scripts
  - [x] Test for stdio transport
  - [x] Test for HTTP transport
- [x] Write unit tests
  - [x] Auth middleware tests
  - [x] Auth manager tests
  - [x] API client tests
  - [ ] Resource tests
  - [x] Tools tests
    - [x] Project tools tests
    - [x] Preview tools tests
    - [ ] Repository tools tests
- [ ] Write integration tests
- [x] Set up test automation
  - [x] Test scripts
  - [x] Github Actions workflow

## Documentation

- [x] Create README.md with installation and usage instructions
- [x] Document available resources
- [x] Document available tools
- [x] Document configuration options
- [x] Add examples of using the MCP server with Claude and other clients
- [ ] Add API documentation

## Deployment and Distribution

- [ ] Package the MCP server for distribution
- [ ] Create release pipeline
- [ ] Publish to npm
- [ ] Add Docker support

## Tugboat API Implementation Plan

### Project Management

- [x] Project creation
  - [x] Create new project
  - [x] Configure project settings
- [x] Project updates
  - [x] Update project name
  - [x] Update project settings
  - [x] Update access tokens/keys
- [x] Project deletion
- [x] List projects
- [x] Get project details
- [x] Get project repositories
- [x] Get project jobs
- [x] Get project statistics

### Repository Management

- [x] Repository creation
  - [x] Connect to GitHub repository
  - [x] Connect to GitLab repository
  - [x] Connect to Bitbucket repository
- [x] Repository configuration
  - [x] Update repository settings
  - [x] Configure build settings
  - [x] Set environment variables
  - [x] Set build hooks
- [x] Repository deletion
- [x] Get repository details
- [x] Get repository branches
- [x] Get repository tags
- [x] Get repository pull requests
- [x] Get repository previews
- [x] Get repository jobs
- [x] Get repository statistics
- [x] Update repository authentication
- [x] Generate SSH keys

### Preview Management (extend existing)

- [x] Preview configuration
  - [x] Update preview settings
  - [x] Set environment variables
  - [x] Configure services
- [x] Preview operations
  - [x] Reset preview
  - [x] Clone preview
  - [x] Lock/unlock preview
  - [x] Start preview
  - [x] Stop preview
  - [x] Suspend preview
  - [x] Get preview jobs
  - [x] Get preview statistics

### Service Management

- [ ] List services for a preview
- [ ] Get service details
- [ ] Start/stop/restart services
- [ ] Execute commands in service containers
- [ ] Access service logs

See GitHub Issue [#2](https://github.com/Lullabot/tugboat-mcp/issues/2) for implementation details.

### Job Management

- [ ] List jobs
- [ ] Get job details
- [ ] Cancel running jobs
- [ ] View job logs

See GitHub Issue [#4](https://github.com/Lullabot/tugboat-mcp/issues/4) for implementation details.

### Visual Diffs Management

- [ ] Generate visual diffs
- [ ] Retrieve visual diff results
- [ ] Configure visual diff settings
- [ ] Visual diff analysis

See GitHub Issue [#5](https://github.com/Lullabot/tugboat-mcp/issues/5) for implementation details.

### Lighthouse Reports Management

- [ ] Generate Lighthouse reports
- [ ] Retrieve report results
- [ ] Configure report settings
- [ ] Report analysis (Performance, Accessibility, Best Practices, PWA, SEO)

See GitHub Issue [#6](https://github.com/Lullabot/tugboat-mcp/issues/6) for implementation details.

### Screenshots Management

- [ ] Generate screenshots
- [ ] Retrieve screenshots
- [ ] Configure screenshot settings
- [ ] Screenshot management (list, delete, compare)

See GitHub Issue [#7](https://github.com/Lullabot/tugboat-mcp/issues/7) for implementation details.

### Mail Management

- [ ] Configure mail settings
- [ ] Manage mail configurations
- [ ] Test mail delivery and routing

See GitHub Issue [#8](https://github.com/Lullabot/tugboat-mcp/issues/8) for implementation details.

### Docker Registry Management

- [ ] Configure Docker registries
- [ ] Manage registry settings
- [ ] Handle registry integration

See GitHub Issue [#9](https://github.com/Lullabot/tugboat-mcp/issues/9) for implementation details.

### Analytics and Reporting

- [ ] Project usage statistics
  - [ ] Resource consumption
  - [ ] Build times
  - [ ] Preview counts
- [ ] Repository metrics
  - [ ] Build success rates
  - [ ] Average build duration
  - [ ] Preview activity
- [ ] Service performance metrics
  - [ ] Uptime tracking
  - [ ] Resource utilization
  - [ ] Response times
- [ ] Generate consolidated reports

## Future Enhancements

- [ ] Implement pagination for list resources
- [ ] Add filtering options for resources
- [ ] Implement caching for better performance
- [ ] Add metrics and monitoring
- [ ] Support for webhooks and event notifications
- [ ] Add interactive demos
- [ ] Implement retry logic for API requests
