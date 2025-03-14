import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerSearchTools } from '../src/tools/search';
import { TugboatApiClient } from '../src/utils/api-client';
import { AuthManager } from '../src/utils/auth';

// Mocks
jest.mock('@modelcontextprotocol/sdk/server/mcp.js');
jest.mock('../src/utils/api-client');
jest.mock('../src/utils/auth');

describe('Search Tools', () => {
  let server: jest.Mocked<McpServer>;
  let apiClient: jest.Mocked<TugboatApiClient>;
  let authManager: jest.Mocked<AuthManager>;
  let logger: { log: jest.Mock; error: jest.Mock };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mocks
    server = new McpServer() as jest.Mocked<McpServer>;
    apiClient = new TugboatApiClient({}) as jest.Mocked<TugboatApiClient>;
    authManager = new AuthManager({}) as jest.Mocked<AuthManager>;
    logger = {
      log: jest.fn(),
      error: jest.fn()
    };

    // Common mock implementations
    server.tool = jest.fn();
    authManager.isAuthorized = jest.fn().mockResolvedValue(true);
  });

  describe('searchPreviews tool', () => {
    it('should register the searchPreviews tool', () => {
      registerSearchTools(server, apiClient, authManager, logger);
      expect(server.tool).toHaveBeenCalledWith(
        'searchPreviews',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should successfully search previews when authorized', async () => {
      // Setup
      registerSearchTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'searchPreviews'
      )[2];
      
      // Mock API response
      const mockPreviews = {
        previews: [
          {
            id: 'preview123',
            name: 'Feature Preview',
            status: 'ready',
            url: 'https://preview-url.example.com',
            repository: { id: 'repo1', name: 'Repository 1' },
            project: { id: 'project1', name: 'Project 1' }
          },
          {
            id: 'preview456',
            name: 'Bugfix Preview',
            status: 'building',
            url: 'https://preview-url-2.example.com',
            repository: { id: 'repo2', name: 'Repository 2' },
            project: { id: 'project1', name: 'Project 1' }
          }
        ]
      };
      
      apiClient.searchPreviews = jest.fn().mockResolvedValue(mockPreviews);

      // Call handler
      const result = await toolHandler({ 
        query: 'preview',
        limit: 10
      });

      // Assertions
      expect(apiClient.searchPreviews).toHaveBeenCalledWith({
        query: 'preview',
        limit: 10
      });
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Found 2 previews matching')
      )).toBe(true);
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Feature Preview')
      )).toBe(true);
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Bugfix Preview')
      )).toBe(true);
    });

    it('should check authorization when project ID is provided', async () => {
      // Setup
      registerSearchTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'searchPreviews'
      )[2];
      
      // Mock API response
      const mockPreviews = {
        previews: [
          {
            id: 'preview123',
            name: 'Feature Preview',
            project: { id: 'project123', name: 'Project 1' }
          }
        ]
      };
      
      apiClient.searchPreviews = jest.fn().mockResolvedValue(mockPreviews);

      // Call handler with project ID
      const result = await toolHandler({ 
        query: 'preview',
        projectId: 'project123'
      });

      // Assertions
      expect(authManager.isAuthorized).toHaveBeenCalledWith('project/project123', 'read');
      expect(apiClient.searchPreviews).toHaveBeenCalledWith({
        query: 'preview',
        limit: 10,
        project: 'project123'
      });
      expect(result.content).toBeDefined();
    });

    it('should return error when unauthorized for specific project', async () => {
      // Setup
      registerSearchTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'searchPreviews'
      )[2];
      
      // Mock authorization failure
      authManager.isAuthorized = jest.fn().mockResolvedValue(false);

      // Call handler with project ID
      const result = await toolHandler({ 
        query: 'preview',
        projectId: 'project123'
      });

      // Assertions
      expect(authManager.isAuthorized).toHaveBeenCalledWith('project/project123', 'read');
      expect(apiClient.searchPreviews).not.toHaveBeenCalled();
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Error: You do not have permission')
      )).toBe(true);
    });

    it('should handle no previews found', async () => {
      // Setup
      registerSearchTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'searchPreviews'
      )[2];
      
      // Mock API response with no previews
      apiClient.searchPreviews = jest.fn().mockResolvedValue({ previews: [] });

      // Call handler
      const result = await toolHandler({ query: 'nonexistent' });

      // Assertions
      expect(apiClient.searchPreviews).toHaveBeenCalledWith({
        query: 'nonexistent',
        limit: 10
      });
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('No previews found matching')
      )).toBe(true);
    });
  });

  describe('searchProjects tool', () => {
    it('should register the searchProjects tool', () => {
      registerSearchTools(server, apiClient, authManager, logger);
      expect(server.tool).toHaveBeenCalledWith(
        'searchProjects',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should successfully search projects', async () => {
      // Setup
      registerSearchTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'searchProjects'
      )[2];
      
      // Mock API response
      const mockProjects = {
        projects: [
          {
            id: 'project123',
            name: 'Web Project',
            description: 'A web application project',
            repositories: [{ id: 'repo1' }, { id: 'repo2' }],
            created: new Date().toISOString()
          },
          {
            id: 'project456',
            name: 'Mobile Project',
            description: 'A mobile application project',
            repositories: [{ id: 'repo3' }],
            created: new Date().toISOString()
          }
        ]
      };
      
      apiClient.searchProjects = jest.fn().mockResolvedValue(mockProjects);

      // Call handler
      const result = await toolHandler({ 
        query: 'project',
        limit: 10
      });

      // Assertions
      expect(apiClient.searchProjects).toHaveBeenCalledWith({
        query: 'project',
        limit: 10
      });
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Found 2 projects matching')
      )).toBe(true);
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Web Project')
      )).toBe(true);
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Mobile Project')
      )).toBe(true);
    });

    it('should filter projects based on authorization', async () => {
      // Setup
      registerSearchTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'searchProjects'
      )[2];
      
      // Mock API response
      const mockProjects = {
        projects: [
          { id: 'project123', name: 'Project 1' },
          { id: 'project456', name: 'Project 2' }
        ]
      };
      
      apiClient.searchProjects = jest.fn().mockResolvedValue(mockProjects);
      
      // Mock authorization - only authorized for one project
      authManager.isAuthorized = jest.fn()
        .mockImplementation(async (resource) => {
          return resource === 'project/project123';
        });

      // Call handler
      const result = await toolHandler({ query: 'project' });

      // Assertions
      expect(apiClient.searchProjects).toHaveBeenCalled();
      expect(authManager.isAuthorized).toHaveBeenCalledTimes(2);
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Found 1 project matching')
      )).toBe(true);
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Project 1')
      )).toBe(true);
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Project 2')
      )).toBe(false);
    });

    it('should handle no authorized projects found', async () => {
      // Setup
      registerSearchTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'searchProjects'
      )[2];
      
      // Mock API response with projects
      const mockProjects = {
        projects: [
          { id: 'project123', name: 'Project 1' },
          { id: 'project456', name: 'Project 2' }
        ]
      };
      
      apiClient.searchProjects = jest.fn().mockResolvedValue(mockProjects);
      
      // Mock authorization - not authorized for any project
      authManager.isAuthorized = jest.fn().mockResolvedValue(false);

      // Call handler
      const result = await toolHandler({ query: 'project' });

      // Assertions
      expect(apiClient.searchProjects).toHaveBeenCalled();
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('No projects found matching')
      )).toBe(true);
    });
  });

  describe('searchRepositories tool', () => {
    it('should register the searchRepositories tool', () => {
      registerSearchTools(server, apiClient, authManager, logger);
      expect(server.tool).toHaveBeenCalledWith(
        'searchRepositories',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should successfully search repositories', async () => {
      // Setup
      registerSearchTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'searchRepositories'
      )[2];
      
      // Mock API response
      const mockRepos = {
        repositories: [
          {
            id: 'repo123',
            name: 'Frontend Repo',
            provider: 'github',
            url: 'https://github.com/org/frontend',
            project: { id: 'project1', name: 'Web Project' },
            private: true
          },
          {
            id: 'repo456',
            name: 'Backend Repo',
            provider: 'gitlab',
            url: 'https://gitlab.com/org/backend',
            project: { id: 'project1', name: 'Web Project' },
            private: false
          }
        ]
      };
      
      apiClient.searchRepositories = jest.fn().mockResolvedValue(mockRepos);

      // Call handler
      const result = await toolHandler({ 
        query: 'repo',
        limit: 10
      });

      // Assertions
      expect(apiClient.searchRepositories).toHaveBeenCalledWith({
        query: 'repo',
        limit: 10
      });
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Found 2 repositories matching')
      )).toBe(true);
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Frontend Repo')
      )).toBe(true);
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Backend Repo')
      )).toBe(true);
    });

    it('should check authorization when project ID is provided', async () => {
      // Setup
      registerSearchTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'searchRepositories'
      )[2];
      
      // Mock API response
      const mockRepos = {
        repositories: [
          {
            id: 'repo123',
            name: 'Test Repo',
            project: { id: 'project123', name: 'Project 1' }
          }
        ]
      };
      
      apiClient.searchRepositories = jest.fn().mockResolvedValue(mockRepos);

      // Call handler with project ID
      const result = await toolHandler({ 
        query: 'repo',
        projectId: 'project123'
      });

      // Assertions
      expect(authManager.isAuthorized).toHaveBeenCalledWith('project/project123', 'read');
      expect(apiClient.searchRepositories).toHaveBeenCalledWith({
        query: 'repo',
        limit: 10,
        project: 'project123'
      });
      expect(result.content).toBeDefined();
    });

    it('should return error when unauthorized for specific project', async () => {
      // Setup
      registerSearchTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'searchRepositories'
      )[2];
      
      // Mock authorization failure
      authManager.isAuthorized = jest.fn().mockResolvedValue(false);

      // Call handler with project ID
      const result = await toolHandler({ 
        query: 'repo',
        projectId: 'project123'
      });

      // Assertions
      expect(authManager.isAuthorized).toHaveBeenCalledWith('project/project123', 'read');
      expect(apiClient.searchRepositories).not.toHaveBeenCalled();
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Error: You do not have permission')
      )).toBe(true);
    });

    it('should filter repositories based on authorization', async () => {
      // Setup
      registerSearchTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'searchRepositories'
      )[2];
      
      // Mock API response
      const mockRepos = {
        repositories: [
          {
            id: 'repo123',
            name: 'Repo 1',
            project: { id: 'project1', name: 'Project 1' }
          },
          {
            id: 'repo456',
            name: 'Repo 2',
            project: { id: 'project2', name: 'Project 2' }
          }
        ]
      };
      
      apiClient.searchRepositories = jest.fn().mockResolvedValue(mockRepos);
      
      // Mock authorization - only authorized for one project
      authManager.isAuthorized = jest.fn()
        .mockImplementation(async (resource) => {
          return resource === 'project/project1';
        });

      // Call handler
      const result = await toolHandler({ query: 'repo' });

      // Assertions
      expect(apiClient.searchRepositories).toHaveBeenCalled();
      expect(authManager.isAuthorized).toHaveBeenCalledTimes(2);
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Found 1 repository matching')
      )).toBe(true);
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Repo 1')
      )).toBe(true);
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Repo 2')
      )).toBe(false);
    });
  });
}); 