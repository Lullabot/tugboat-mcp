import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerRepositoryTools } from '../src/tools/repositories';
import { TugboatApiClient } from '../src/utils/api-client';
import { AuthManager } from '../src/utils/auth';

// Mocks
jest.mock('@modelcontextprotocol/sdk/server/mcp.js');
jest.mock('../src/utils/api-client');
jest.mock('../src/utils/auth');

describe('Repository Tools', () => {
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

  describe('createRepository tool', () => {
    it('should register the createRepository tool', () => {
      registerRepositoryTools(server, apiClient, authManager, logger);
      expect(server.tool).toHaveBeenCalledWith(
        'createRepository',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should successfully create a repository when authorized', async () => {
      // Setup
      registerRepositoryTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'createRepository'
      )[2];
      
      // Mock API response
      const mockRepo = {
        id: 'repo123',
        name: 'Test Repo',
        provider: 'github',
        url: 'https://github.com/org/repo',
        private: true
      };
      apiClient.createRepository = jest.fn().mockResolvedValue({ repository: mockRepo });

      // Call handler
      const result = await toolHandler({ 
        project: 'project123',
        name: 'Test Repo',
        provider: 'github',
        url: 'https://github.com/org/repo',
        privateRepo: true
      });

      // Assertions
      expect(authManager.isAuthorized).toHaveBeenCalledWith('project/project123', 'write');
      expect(apiClient.createRepository).toHaveBeenCalledWith(
        'project123', 
        'Test Repo', 
        'github', 
        'https://github.com/org/repo', 
        true, 
        undefined
      );
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Repository created successfully')
      )).toBe(true);
    });

    it('should return error when unauthorized', async () => {
      // Setup
      registerRepositoryTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'createRepository'
      )[2];
      
      // Mock authorization failure
      authManager.isAuthorized = jest.fn().mockResolvedValue(false);

      // Call handler
      const result = await toolHandler({ 
        project: 'project123',
        name: 'Test Repo',
        provider: 'github',
        url: 'https://github.com/org/repo'
      });

      // Assertions
      expect(authManager.isAuthorized).toHaveBeenCalledWith('project/project123', 'write');
      expect(apiClient.createRepository).not.toHaveBeenCalled();
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Error: You do not have permission')
      )).toBe(true);
    });
  });

  describe('updateRepository tool', () => {
    it('should register the updateRepository tool', () => {
      registerRepositoryTools(server, apiClient, authManager, logger);
      expect(server.tool).toHaveBeenCalledWith(
        'updateRepository',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should successfully update a repository when authorized', async () => {
      // Setup
      registerRepositoryTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'updateRepository'
      )[2];
      
      // Mock API responses
      const mockRepo = {
        id: 'repo123',
        name: 'Updated Repo',
        url: 'https://github.com/org/newrepo',
        private: true,
        project: { id: 'project123' }
      };
      
      apiClient.getRepository = jest.fn().mockResolvedValue({ repository: mockRepo });
      apiClient.updateRepository = jest.fn().mockResolvedValue({ repository: mockRepo });

      // Call handler
      const result = await toolHandler({ 
        id: 'repo123', 
        name: 'Updated Repo', 
        url: 'https://github.com/org/newrepo', 
        privateRepo: true
      });

      // Assertions
      expect(authManager.isAuthorized).toHaveBeenCalledWith('project/project123', 'write');
      expect(apiClient.updateRepository).toHaveBeenCalledWith(
        'repo123', 
        { 
          name: 'Updated Repo', 
          url: 'https://github.com/org/newrepo', 
          private: true, 
          buildSettings: undefined 
        }
      );
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Repository updated successfully')
      )).toBe(true);
    });

    it('should return error when no fields provided for update', async () => {
      // Setup
      registerRepositoryTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'updateRepository'
      )[2];

      // Call handler with only ID
      const result = await toolHandler({ id: 'repo123' });

      // Assertions
      expect(apiClient.getRepository).not.toHaveBeenCalled();
      expect(apiClient.updateRepository).not.toHaveBeenCalled();
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Error: At least one field must be provided')
      )).toBe(true);
    });
  });

  describe('deleteRepository tool', () => {
    it('should register the deleteRepository tool', () => {
      registerRepositoryTools(server, apiClient, authManager, logger);
      expect(server.tool).toHaveBeenCalledWith(
        'deleteRepository',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should successfully delete a repository when authorized', async () => {
      // Setup
      registerRepositoryTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'deleteRepository'
      )[2];
      
      // Mock API responses
      const mockRepo = {
        id: 'repo123',
        project: { id: 'project123' }
      };
      
      apiClient.getRepository = jest.fn().mockResolvedValue({ repository: mockRepo });
      apiClient.deleteRepository = jest.fn().mockResolvedValue({ success: true });

      // Call handler
      const result = await toolHandler({ id: 'repo123' });

      // Assertions
      expect(authManager.isAuthorized).toHaveBeenCalledWith('project/project123', 'write');
      expect(apiClient.deleteRepository).toHaveBeenCalledWith('repo123');
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Repository repo123 deleted successfully')
      )).toBe(true);
    });
  });

  describe('getRepository tool', () => {
    it('should register the getRepository tool', () => {
      registerRepositoryTools(server, apiClient, authManager, logger);
      expect(server.tool).toHaveBeenCalledWith(
        'getRepository',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should successfully get a repository when authorized', async () => {
      // Setup
      registerRepositoryTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'getRepository'
      )[2];
      
      // Mock API responses
      const mockRepo = {
        id: 'repo123',
        name: 'Test Repo',
        url: 'https://github.com/org/repo',
        provider: 'github',
        private: true,
        project: { id: 'project123', name: 'Test Project' },
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };
      
      apiClient.getRepository = jest.fn().mockResolvedValue({ repository: mockRepo });
      apiClient.getRepositoryPreviews = jest.fn().mockResolvedValue({ previews: [] });

      // Call handler
      const result = await toolHandler({ id: 'repo123' });

      // Assertions
      expect(authManager.isAuthorized).toHaveBeenCalledWith('project/project123', 'read');
      expect(apiClient.getRepository).toHaveBeenCalledWith('repo123');
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Test Repo')
      )).toBe(true);
    });
  });

  describe('getRepositoryBranches tool', () => {
    it('should register the getRepositoryBranches tool', () => {
      registerRepositoryTools(server, apiClient, authManager, logger);
      expect(server.tool).toHaveBeenCalledWith(
        'getRepositoryBranches',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should successfully get repository branches when authorized', async () => {
      // Setup
      registerRepositoryTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'getRepositoryBranches'
      )[2];
      
      // Mock API responses
      const mockRepo = {
        id: 'repo123',
        name: 'Test Repo',
        project: { id: 'project123' }
      };
      
      const mockBranches = {
        branches: [
          { name: 'main', commit: '1234567890abcdef' },
          { name: 'develop', commit: 'abcdef1234567890' }
        ]
      };
      
      apiClient.getRepository = jest.fn().mockResolvedValue({ repository: mockRepo });
      apiClient.getRepositoryBranches = jest.fn().mockResolvedValue(mockBranches);

      // Call handler
      const result = await toolHandler({ id: 'repo123' });

      // Assertions
      expect(authManager.isAuthorized).toHaveBeenCalledWith('project/project123', 'read');
      expect(apiClient.getRepositoryBranches).toHaveBeenCalledWith('repo123');
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Branches for repository')
      )).toBe(true);
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('main')
      )).toBe(true);
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('develop')
      )).toBe(true);
    });
  });

  describe('getRepositoryPullRequests tool', () => {
    it('should register the getRepositoryPullRequests tool', () => {
      registerRepositoryTools(server, apiClient, authManager, logger);
      expect(server.tool).toHaveBeenCalledWith(
        'getRepositoryPullRequests',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should successfully get repository pull requests when authorized', async () => {
      // Setup
      registerRepositoryTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'getRepositoryPullRequests'
      )[2];
      
      // Mock API responses
      const mockRepo = {
        id: 'repo123',
        name: 'Test Repo',
        project: { id: 'project123' }
      };
      
      const mockPRs = {
        pullRequests: [
          { 
            number: 123, 
            title: 'Feature PR', 
            author: 'user1', 
            state: 'open',
            url: 'https://github.com/org/repo/pull/123'
          },
          { 
            number: 124, 
            title: 'Bugfix PR', 
            author: 'user2', 
            state: 'closed',
            url: 'https://github.com/org/repo/pull/124'
          }
        ]
      };
      
      apiClient.getRepository = jest.fn().mockResolvedValue({ repository: mockRepo });
      apiClient.getRepositoryPullRequests = jest.fn().mockResolvedValue(mockPRs);

      // Call handler
      const result = await toolHandler({ id: 'repo123' });

      // Assertions
      expect(authManager.isAuthorized).toHaveBeenCalledWith('project/project123', 'read');
      expect(apiClient.getRepositoryPullRequests).toHaveBeenCalledWith('repo123');
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Pull Requests for repository')
      )).toBe(true);
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Feature PR')
      )).toBe(true);
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Bugfix PR')
      )).toBe(true);
    });
  });
}); 