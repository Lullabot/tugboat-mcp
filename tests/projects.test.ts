import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerProjectTools } from '../src/tools/projects';
import { TugboatApiClient } from '../src/utils/api-client';
import { AuthManager } from '../src/utils/auth';

// Mocks
jest.mock('@modelcontextprotocol/sdk/server/mcp.js');
jest.mock('../src/utils/api-client');
jest.mock('../src/utils/auth');

describe('Project Tools', () => {
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

  describe('createProject tool', () => {
    it('should register the createProject tool', () => {
      registerProjectTools(server, apiClient, authManager, logger);
      expect(server.tool).toHaveBeenCalledWith(
        'createProject',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should successfully create a project when authorized', async () => {
      // Setup
      registerProjectTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'createProject'
      )[2];
      
      // Mock API response
      const mockProject = {
        id: 'project123',
        name: 'Test Project',
        description: 'Project description'
      };
      apiClient.createProject = jest.fn().mockResolvedValue({ project: mockProject });

      // Call handler
      const result = await toolHandler({ name: 'Test Project', description: 'Project description' });

      // Assertions
      expect(authManager.isAuthorized).toHaveBeenCalledWith('admin', 'write');
      expect(apiClient.createProject).toHaveBeenCalledWith('Test Project', 'Project description');
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Project created successfully')
      )).toBe(true);
    });

    it('should return error when unauthorized', async () => {
      // Setup
      registerProjectTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'createProject'
      )[2];
      
      // Mock authorization failure
      authManager.isAuthorized = jest.fn().mockResolvedValue(false);

      // Call handler
      const result = await toolHandler({ name: 'Test Project' });

      // Assertions
      expect(authManager.isAuthorized).toHaveBeenCalledWith('admin', 'write');
      expect(apiClient.createProject).not.toHaveBeenCalled();
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Error: You do not have permission')
      )).toBe(true);
    });
  });

  describe('updateProject tool', () => {
    it('should register the updateProject tool', () => {
      registerProjectTools(server, apiClient, authManager, logger);
      expect(server.tool).toHaveBeenCalledWith(
        'updateProject',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should successfully update a project when authorized', async () => {
      // Setup
      registerProjectTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'updateProject'
      )[2];
      
      // Mock API response
      const mockProject = {
        id: 'project123',
        name: 'Updated Project',
        description: 'Updated description'
      };
      apiClient.updateProject = jest.fn().mockResolvedValue({ project: mockProject });

      // Call handler
      const result = await toolHandler({ 
        id: 'project123', 
        name: 'Updated Project', 
        description: 'Updated description'
      });

      // Assertions
      expect(authManager.isAuthorized).toHaveBeenCalledWith('project/project123', 'write');
      expect(apiClient.updateProject).toHaveBeenCalledWith(
        'project123', 
        { name: 'Updated Project', description: 'Updated description' }
      );
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Project updated successfully')
      )).toBe(true);
    });

    it('should return error when no fields provided for update', async () => {
      // Setup
      registerProjectTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'updateProject'
      )[2];

      // Call handler with only ID
      const result = await toolHandler({ id: 'project123' });

      // Assertions
      expect(apiClient.updateProject).not.toHaveBeenCalled();
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Error: At least one field must be provided')
      )).toBe(true);
    });
  });

  describe('deleteProject tool', () => {
    it('should register the deleteProject tool', () => {
      registerProjectTools(server, apiClient, authManager, logger);
      expect(server.tool).toHaveBeenCalledWith(
        'deleteProject',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should successfully delete a project when authorized', async () => {
      // Setup
      registerProjectTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'deleteProject'
      )[2];
      
      // Mock API response
      apiClient.deleteProject = jest.fn().mockResolvedValue({ success: true });

      // Call handler
      const result = await toolHandler({ id: 'project123' });

      // Assertions
      expect(authManager.isAuthorized).toHaveBeenCalledWith('project/project123', 'delete');
      expect(apiClient.deleteProject).toHaveBeenCalledWith('project123');
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Project deleted successfully')
      )).toBe(true);
    });
  });

  describe('getProject tool', () => {
    it('should register the getProject tool', () => {
      registerProjectTools(server, apiClient, authManager, logger);
      expect(server.tool).toHaveBeenCalledWith(
        'getProject',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should successfully get a project when authorized', async () => {
      // Setup
      registerProjectTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'getProject'
      )[2];
      
      // Mock API response
      const mockProject = {
        id: 'project123',
        name: 'Test Project',
        description: 'Project description',
        repositories: [{ id: 'repo1', name: 'Repository 1' }]
      };
      apiClient.getProject = jest.fn().mockResolvedValue({ project: mockProject });

      // Call handler
      const result = await toolHandler({ id: 'project123' });

      // Assertions
      expect(authManager.isAuthorized).toHaveBeenCalledWith('project/project123', 'read');
      expect(apiClient.getProject).toHaveBeenCalledWith('project123');
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Test Project')
      )).toBe(true);
    });
  });

  describe('listProjects tool', () => {
    it('should register the listProjects tool', () => {
      registerProjectTools(server, apiClient, authManager, logger);
      expect(server.tool).toHaveBeenCalledWith(
        'listProjects',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should successfully list projects when authorized', async () => {
      // Setup
      registerProjectTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'listProjects'
      )[2];
      
      // Mock API response
      const mockProjects = {
        projects: [
          { id: 'project1', name: 'Project 1' },
          { id: 'project2', name: 'Project 2' }
        ],
        total: 2
      };
      apiClient.listProjects = jest.fn().mockResolvedValue(mockProjects);

      // Call handler
      const result = await toolHandler({ limit: 10, offset: 0 });

      // Assertions
      expect(apiClient.listProjects).toHaveBeenCalledWith(10, 0);
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('Found 2 projects')
      )).toBe(true);
    });

    it('should handle no projects found', async () => {
      // Setup
      registerProjectTools(server, apiClient, authManager, logger);
      
      // Get the handler function
      const toolHandler = (server.tool as jest.Mock).mock.calls.find(
        call => call[0] === 'listProjects'
      )[2];
      
      // Mock API response with no projects
      apiClient.listProjects = jest.fn().mockResolvedValue({ projects: [], total: 0 });

      // Call handler
      const result = await toolHandler({});

      // Assertions
      expect(apiClient.listProjects).toHaveBeenCalledWith(undefined, undefined);
      expect(result.content).toBeDefined();
      expect(result.content.some(item => 
        item.type === 'text' && item.text.includes('No projects found')
      )).toBe(true);
    });
  });
}); 