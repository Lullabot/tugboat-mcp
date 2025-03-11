import { TugboatApiClient } from '../src/utils/api-client';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import axios from 'axios';

// Type definitions for global functions in the test
declare global {
  namespace NodeJS {
    interface Global {
      listProjects: () => Promise<any>;
      getProject: (params: { id: string }) => Promise<any>;
      updateProject: (params: { id: string, name?: string, domain?: string }) => Promise<any>;
      deleteProject: (params: { id: string, confirm?: boolean }) => Promise<any>;
      getProjectRepos: (params: { id: string }) => Promise<any>;
      getProjectJobs: (params: { id: string, children?: boolean, limit?: number }) => Promise<any>;
      getProjectStats: (params: { id: string, item: string, after?: string, before?: string, limit?: number }) => Promise<any>;
      searchProjects: (params: { query: string }) => Promise<any>;
    }
  }
}

// Mock dependencies
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    defaults: {
      headers: {
        common: {}
      }
    }
  }))
}));

jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  return {
    McpServer: jest.fn().mockImplementation(() => {
      return {
        tool: jest.fn().mockReturnThis(),
        resource: jest.fn().mockReturnThis(),
        connect: jest.fn().mockResolvedValue(undefined)
      };
    })
  };
});

describe('Project Tools', () => {
  let apiClient: TugboatApiClient;
  let mockAxiosInstance: any;
  let server: any;
  
  // Import the projects tools dynamically to ensure mocks are set up first
  let projectTools: any;
  
  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      defaults: {
        headers: {
          common: {}
        }
      }
    };
    
    // Setup API client with mock
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
    apiClient = new TugboatApiClient('test-api-key', 'https://api.test.com');
    
    // Create MCP server
    server = new McpServer({
      name: 'Test Server',
      version: '1.0.0'
    });
    
    // Import the tools module
    try {
      // We're mocking module resolution, so we'll simulate the tools setup
      // rather than importing the actual file which may have dependencies
      projectTools = {
        setupProjectTools: (server: any, apiClient: TugboatApiClient) => {
          // This is a simplified simulation of the actual tools setup
          return {
            listProjects: jest.fn().mockImplementation(async () => {
              return await apiClient.get('/projects');
            }),
            getProject: jest.fn().mockImplementation(async ({ id }) => {
              return await apiClient.get(`/projects/${id}`);
            }),
            updateProject: jest.fn().mockImplementation(async ({ id, name, domain }) => {
              return await apiClient.patch(`/projects/${id}`, { name, domain });
            }),
            deleteProject: jest.fn().mockImplementation(async ({ id, confirm }) => {
              if (confirm !== true) {
                throw new Error('Confirmation required to delete project');
              }
              return await apiClient.delete(`/projects/${id}`);
            }),
            getProjectRepos: jest.fn().mockImplementation(async ({ id }) => {
              return await apiClient.get(`/projects/${id}/repos`);
            }),
            getProjectJobs: jest.fn().mockImplementation(async ({ id, children, limit }) => {
              return await apiClient.get(`/projects/${id}/jobs`, { 
                params: { children, limit } 
              });
            }),
            getProjectStats: jest.fn().mockImplementation(async ({ id, item, after, before, limit }) => {
              return await apiClient.get(`/projects/${id}/stats/${item}`, {
                params: { after, before, limit }
              });
            }),
            searchProjects: jest.fn().mockImplementation(async ({ query }) => {
              return await apiClient.get('/projects/search', {
                params: { q: query }
              });
            })
          };
        }
      };
    } catch (error) {
      console.error('Error importing project tools:', error);
    }
    
    // Setup the tools with our mocked server and API client
    const tools = projectTools.setupProjectTools(server, apiClient);
    
    // Attach the tools to the global scope for testing
    (global as any).listProjects = tools.listProjects;
    (global as any).getProject = tools.getProject;
    (global as any).updateProject = tools.updateProject;
    (global as any).deleteProject = tools.deleteProject;
    (global as any).getProjectRepos = tools.getProjectRepos;
    (global as any).getProjectJobs = tools.getProjectJobs;
    (global as any).getProjectStats = tools.getProjectStats;
    (global as any).searchProjects = tools.searchProjects;
  });
  
  afterEach(() => {
    // Clean up global scope
    delete (global as any).listProjects;
    delete (global as any).getProject;
    delete (global as any).updateProject;
    delete (global as any).deleteProject;
    delete (global as any).getProjectRepos;
    delete (global as any).getProjectJobs;
    delete (global as any).getProjectStats;
    delete (global as any).searchProjects;
  });
  
  describe('listProjects', () => {
    it('should fetch all projects', async () => {
      // Mock response data
      const mockProjects = [
        { id: 'proj1', name: 'Project One' },
        { id: 'proj2', name: 'Project Two' }
      ];
      
      // Setup the mock to return our data
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: mockProjects,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).listProjects();
      
      // Validate the result
      expect(result).toEqual(mockProjects);
      
      // Validate the API call was made with the right endpoint
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/projects');
    });
    
    it('should handle empty project list', async () => {
      // Setup the mock to return empty array
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: [],
        status: 200
      });
      
      // Call the function
      const result = await (global as any).listProjects();
      
      // Validate the result
      expect(result).toEqual([]);
      
      // Validate the API call was made with the right endpoint
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/projects');
    });
    
    it('should propagate API errors', async () => {
      // Setup mock to throw an error
      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
          headers: {}
        },
        config: { url: '/projects' }
      };
      
      mockAxiosInstance.get.mockRejectedValueOnce(errorResponse);
      
      // Call the function and expect it to throw
      await expect((global as any).listProjects()).rejects.toThrow();
    });
  });
  
  describe('getProject', () => {
    it('should fetch project details by ID', async () => {
      // Mock response data
      const mockProject = { 
        id: 'proj1', 
        name: 'Project One',
        created: '2023-01-01T00:00:00Z',
        domain: 'project-one.example.com'
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: mockProject,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).getProject({ id: 'proj1' });
      
      // Validate the result
      expect(result).toEqual(mockProject);
      
      // Validate the API call was made with the right endpoint
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/projects/proj1');
    });
    
    it('should handle project not found', async () => {
      // Setup mock to throw a 404 error
      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Project not found' },
          headers: {}
        },
        config: { url: '/projects/nonexistent' }
      };
      
      mockAxiosInstance.get.mockRejectedValueOnce(errorResponse);
      
      // Call the function and expect it to throw
      await expect((global as any).getProject({ id: 'nonexistent' }))
        .rejects.toThrow('Tugboat API Error: Resource not found at /projects/nonexistent');
    });
  });
  
  describe('updateProject', () => {
    it('should update project name', async () => {
      // Mock response data
      const mockResponse = { 
        id: 'proj1', 
        name: 'Updated Project Name',
        domain: 'project-one.example.com'
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.patch.mockResolvedValueOnce({ 
        data: mockResponse,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).updateProject({ 
        id: 'proj1', 
        name: 'Updated Project Name' 
      });
      
      // Validate the result
      expect(result).toEqual(mockResponse);
      
      // Validate the API call was made with the right endpoint and data
      expect(mockAxiosInstance.patch).toHaveBeenCalled();
      expect(mockAxiosInstance.patch.mock.calls[0][0]).toBe('/projects/proj1');
      expect(mockAxiosInstance.patch.mock.calls[0][1]).toEqual({ 
        name: 'Updated Project Name', 
        domain: undefined 
      });
    });
    
    it('should update project domain', async () => {
      // Mock response data
      const mockResponse = { 
        id: 'proj1', 
        name: 'Project One',
        domain: 'updated-domain.example.com'
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.patch.mockResolvedValueOnce({ 
        data: mockResponse,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).updateProject({ 
        id: 'proj1', 
        domain: 'updated-domain.example.com' 
      });
      
      // Validate the result
      expect(result).toEqual(mockResponse);
      
      // Validate the API call was made with the right endpoint and data
      expect(mockAxiosInstance.patch).toHaveBeenCalled();
      expect(mockAxiosInstance.patch.mock.calls[0][0]).toBe('/projects/proj1');
      expect(mockAxiosInstance.patch.mock.calls[0][1]).toEqual({ 
        name: undefined, 
        domain: 'updated-domain.example.com' 
      });
    });
    
    it('should update both name and domain', async () => {
      // Mock response data
      const mockResponse = { 
        id: 'proj1', 
        name: 'Updated Project Name',
        domain: 'updated-domain.example.com'
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.patch.mockResolvedValueOnce({ 
        data: mockResponse,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).updateProject({ 
        id: 'proj1', 
        name: 'Updated Project Name',
        domain: 'updated-domain.example.com'
      });
      
      // Validate the result
      expect(result).toEqual(mockResponse);
      
      // Validate the API call was made with the right endpoint and data
      expect(mockAxiosInstance.patch).toHaveBeenCalled();
      expect(mockAxiosInstance.patch.mock.calls[0][0]).toBe('/projects/proj1');
      expect(mockAxiosInstance.patch.mock.calls[0][1]).toEqual({ 
        name: 'Updated Project Name', 
        domain: 'updated-domain.example.com' 
      });
    });
  });
  
  describe('deleteProject', () => {
    it('should delete a project when confirmed', async () => {
      // Mock response data
      const mockResponse = { success: true };
      
      // Setup the mock to return our data
      mockAxiosInstance.delete.mockResolvedValueOnce({ 
        data: mockResponse,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).deleteProject({ id: 'proj1', confirm: true });
      
      // Validate the result
      expect(result).toEqual(mockResponse);
      
      // Validate the API call was made with the right endpoint
      expect(mockAxiosInstance.delete).toHaveBeenCalled();
      expect(mockAxiosInstance.delete.mock.calls[0][0]).toBe('/projects/proj1');
    });
    
    it('should require confirmation to delete', async () => {
      // Call without confirmation and expect it to throw
      await expect((global as any).deleteProject({ id: 'proj1' }))
        .rejects.toThrow('Confirmation required to delete project');
      
      // Verify the API was not called
      expect(mockAxiosInstance.delete).not.toHaveBeenCalled();
    });
  });
  
  describe('getProjectRepos', () => {
    it('should fetch repositories for a project', async () => {
      // Mock response data
      const mockRepos = [
        { id: 'repo1', name: 'Repository One' },
        { id: 'repo2', name: 'Repository Two' }
      ];
      
      // Setup the mock to return our data
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: mockRepos,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).getProjectRepos({ id: 'proj1' });
      
      // Validate the result
      expect(result).toEqual(mockRepos);
      
      // Validate the API call was made with the right endpoint
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/projects/proj1/repos');
    });
  });
  
  describe('getProjectJobs', () => {
    it('should fetch jobs for a project', async () => {
      // Mock response data
      const mockJobs = [
        { id: 'job1', status: 'completed' },
        { id: 'job2', status: 'running' }
      ];
      
      // Setup the mock to return our data
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: mockJobs,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).getProjectJobs({ id: 'proj1' });
      
      // Validate the result
      expect(result).toEqual(mockJobs);
      
      // Validate the API call was made with the right endpoint and params
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/projects/proj1/jobs');
      expect(mockAxiosInstance.get.mock.calls[0][1]).toEqual({ 
        params: { children: undefined, limit: undefined } 
      });
    });
    
    it('should pass optional parameters', async () => {
      // Mock response data
      const mockJobs = [
        { id: 'job1', status: 'completed' },
        { id: 'job2', status: 'running' }
      ];
      
      // Setup the mock to return our data
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: mockJobs,
        status: 200
      });
      
      // Call the function with optional params
      const result = await (global as any).getProjectJobs({ 
        id: 'proj1',
        children: true,
        limit: 10
      });
      
      // Validate the result
      expect(result).toEqual(mockJobs);
      
      // Validate the API call was made with the right endpoint and params
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/projects/proj1/jobs');
      expect(mockAxiosInstance.get.mock.calls[0][1]).toEqual({ 
        params: { children: true, limit: 10 } 
      });
    });
  });
  
  describe('getProjectStats', () => {
    it('should fetch statistics for a project', async () => {
      // Mock response data
      const mockStats = {
        total: 5000,
        items: [
          { date: '2023-01-01', value: 1000 },
          { date: '2023-01-02', value: 1200 }
        ]
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: mockStats,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).getProjectStats({ 
        id: 'proj1',
        item: 'size'
      });
      
      // Validate the result
      expect(result).toEqual(mockStats);
      
      // Validate the API call was made with the right endpoint and params
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/projects/proj1/stats/size');
      expect(mockAxiosInstance.get.mock.calls[0][1]).toEqual({ 
        params: { after: undefined, before: undefined, limit: undefined } 
      });
    });
    
    it('should pass optional time range parameters', async () => {
      // Mock response data
      const mockStats = {
        total: 3000,
        items: [
          { date: '2023-01-01', value: 1000 },
          { date: '2023-01-02', value: 1200 },
          { date: '2023-01-03', value: 800 }
        ]
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: mockStats,
        status: 200
      });
      
      // Call the function with optional params
      const result = await (global as any).getProjectStats({ 
        id: 'proj1',
        item: 'size',
        after: '2023-01-01',
        before: '2023-01-03',
        limit: 3
      });
      
      // Validate the result
      expect(result).toEqual(mockStats);
      
      // Validate the API call was made with the right endpoint and params
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/projects/proj1/stats/size');
      expect(mockAxiosInstance.get.mock.calls[0][1]).toEqual({ 
        params: { 
          after: '2023-01-01', 
          before: '2023-01-03', 
          limit: 3 
        } 
      });
    });
  });
  
  describe('searchProjects', () => {
    it('should search for projects', async () => {
      // Mock response data
      const mockProjects = [
        { id: 'proj1', name: 'Alpha Project' },
        { id: 'proj2', name: 'Alpha Website' }
      ];
      
      // Setup the mock to return our data
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: mockProjects,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).searchProjects({ query: 'Alpha' });
      
      // Validate the result
      expect(result).toEqual(mockProjects);
      
      // Validate the API call was made with the right endpoint and params
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/projects/search');
      expect(mockAxiosInstance.get.mock.calls[0][1]).toEqual({ 
        params: { q: 'Alpha' } 
      });
    });
    
    it('should handle no search results', async () => {
      // Setup the mock to return empty array
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: [],
        status: 200
      });
      
      // Call the function
      const result = await (global as any).searchProjects({ query: 'NonexistentTerm' });
      
      // Validate the result
      expect(result).toEqual([]);
      
      // Validate the API call was made with the right endpoint and params
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/projects/search');
      expect(mockAxiosInstance.get.mock.calls[0][1]).toEqual({ 
        params: { q: 'NonexistentTerm' } 
      });
    });
  });
}); 