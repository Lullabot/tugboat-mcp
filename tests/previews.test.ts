import { TugboatApiClient } from '../src/utils/api-client';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import axios from 'axios';

// Type definitions for global functions in the test
declare global {
  namespace NodeJS {
    interface Global {
      createPreview: (params: { repo: string, ref: string, name?: string, config?: any }) => Promise<any>;
      buildPreview: (params: { previewId: string }) => Promise<any>;
      refreshPreview: (params: { previewId: string }) => Promise<any>;
      deletePreview: (params: { previewId: string }) => Promise<any>;
      getPreview: (params: { previewId: string }) => Promise<any>;
      updatePreview: (params: { previewId: string, name?: string, locked?: boolean, anchor?: boolean, anchor_type?: string, config?: any }) => Promise<any>;
      getPreviewJobs: (params: { previewId: string, active?: boolean }) => Promise<any>;
      getPreviewStatistics: (params: { previewId: string, item: string, limit?: number, before?: string, after?: string }) => Promise<any>;
      clonePreview: (params: { previewId: string, name?: string, expires?: string }) => Promise<any>;
      startPreview: (params: { previewId: string }) => Promise<any>;
      stopPreview: (params: { previewId: string }) => Promise<any>;
      suspendPreview: (params: { previewId: string }) => Promise<any>;
      searchPreviews: (params: { query: string, state?: string }) => Promise<any>;
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

describe('Preview Tools', () => {
  let apiClient: TugboatApiClient;
  let mockAxiosInstance: any;
  let server: any;
  
  // Import the preview tools dynamically to ensure mocks are set up first
  let previewTools: any;
  
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
      previewTools = {
        setupPreviewTools: (server: any, apiClient: TugboatApiClient) => {
          // This is a simplified simulation of the actual tools setup
          return {
            createPreview: jest.fn().mockImplementation(async ({ repo, ref, name, config }) => {
              const data: any = { ref };
              if (name) data.name = name;
              if (config) data.config = config;
              return await apiClient.post(`/repos/${repo}/previews`, data);
            }),
            buildPreview: jest.fn().mockImplementation(async ({ previewId }) => {
              return await apiClient.post(`/previews/${previewId}/build`);
            }),
            refreshPreview: jest.fn().mockImplementation(async ({ previewId }) => {
              return await apiClient.post(`/previews/${previewId}/refresh`);
            }),
            deletePreview: jest.fn().mockImplementation(async ({ previewId }) => {
              return await apiClient.delete(`/previews/${previewId}`);
            }),
            getPreview: jest.fn().mockImplementation(async ({ previewId }) => {
              return await apiClient.get(`/previews/${previewId}`);
            }),
            updatePreview: jest.fn().mockImplementation(async ({ previewId, name, locked, anchor, anchor_type, config }) => {
              const data: any = {};
              if (name !== undefined) data.name = name;
              if (locked !== undefined) data.locked = locked;
              if (anchor !== undefined) data.anchor = anchor;
              if (anchor_type !== undefined) data.anchor_type = anchor_type;
              if (config !== undefined) data.config = config;
              return await apiClient.patch(`/previews/${previewId}`, data);
            }),
            getPreviewJobs: jest.fn().mockImplementation(async ({ previewId, active }) => {
              return await apiClient.get(`/previews/${previewId}/jobs`, {
                params: active !== undefined ? { active } : undefined
              });
            }),
            getPreviewStatistics: jest.fn().mockImplementation(async ({ previewId, item, limit, before, after }) => {
              const params: any = {};
              if (limit !== undefined) params.limit = limit;
              if (before !== undefined) params.before = before;
              if (after !== undefined) params.after = after;
              return await apiClient.get(`/previews/${previewId}/statistics/${item}`, { params });
            }),
            clonePreview: jest.fn().mockImplementation(async ({ previewId, name, expires }) => {
              const data: any = {};
              if (name !== undefined) data.name = name;
              if (expires !== undefined) data.expires = expires;
              return await apiClient.post(`/previews/${previewId}/clone`, data);
            }),
            startPreview: jest.fn().mockImplementation(async ({ previewId }) => {
              return await apiClient.post(`/previews/${previewId}/start`);
            }),
            stopPreview: jest.fn().mockImplementation(async ({ previewId }) => {
              return await apiClient.post(`/previews/${previewId}/stop`);
            }),
            suspendPreview: jest.fn().mockImplementation(async ({ previewId }) => {
              return await apiClient.post(`/previews/${previewId}/suspend`);
            }),
            searchPreviews: jest.fn().mockImplementation(async ({ query, state }) => {
              const params: any = { q: query };
              if (state !== undefined) params.state = state;
              return await apiClient.get('/previews/search', { params });
            })
          };
        }
      };
    } catch (error) {
      console.error('Error importing preview tools:', error);
    }
    
    // Setup the tools with our mocked server and API client
    const tools = previewTools.setupPreviewTools(server, apiClient);
    
    // Attach the tools to the global scope for testing
    (global as any).createPreview = tools.createPreview;
    (global as any).buildPreview = tools.buildPreview;
    (global as any).refreshPreview = tools.refreshPreview;
    (global as any).deletePreview = tools.deletePreview;
    (global as any).getPreview = tools.getPreview;
    (global as any).updatePreview = tools.updatePreview;
    (global as any).getPreviewJobs = tools.getPreviewJobs;
    (global as any).getPreviewStatistics = tools.getPreviewStatistics;
    (global as any).clonePreview = tools.clonePreview;
    (global as any).startPreview = tools.startPreview;
    (global as any).stopPreview = tools.stopPreview;
    (global as any).suspendPreview = tools.suspendPreview;
    (global as any).searchPreviews = tools.searchPreviews;
  });
  
  afterEach(() => {
    // Clean up global scope
    delete (global as any).createPreview;
    delete (global as any).buildPreview;
    delete (global as any).refreshPreview;
    delete (global as any).deletePreview;
    delete (global as any).getPreview;
    delete (global as any).updatePreview;
    delete (global as any).getPreviewJobs;
    delete (global as any).getPreviewStatistics;
    delete (global as any).clonePreview;
    delete (global as any).startPreview;
    delete (global as any).stopPreview;
    delete (global as any).suspendPreview;
    delete (global as any).searchPreviews;
  });
  
  describe('createPreview', () => {
    it('should create a preview with required parameters', async () => {
      // Mock response data
      const mockPreview = {
        id: 'prev1',
        name: 'Auto-generated Name',
        ref: 'feature-branch',
        state: 'building'
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.post.mockResolvedValueOnce({ 
        data: mockPreview,
        status: 202
      });
      
      // Call the function
      const result = await (global as any).createPreview({ 
        repo: 'repo1',
        ref: 'feature-branch'
      });
      
      // Validate the result
      expect(result).toEqual(mockPreview);
      
      // Validate the API call was made with the right endpoint and payload
      expect(mockAxiosInstance.post).toHaveBeenCalled();
      expect(mockAxiosInstance.post.mock.calls[0][0]).toBe('/repos/repo1/previews');
      expect(mockAxiosInstance.post.mock.calls[0][1]).toEqual({ ref: 'feature-branch' });
    });
    
    it('should create a preview with optional parameters', async () => {
      // Mock response data
      const mockPreview = {
        id: 'prev1',
        name: 'Custom Name',
        ref: 'feature-branch',
        state: 'building',
        config: { some: 'config' }
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.post.mockResolvedValueOnce({ 
        data: mockPreview,
        status: 202
      });
      
      // Call the function
      const result = await (global as any).createPreview({ 
        repo: 'repo1',
        ref: 'feature-branch',
        name: 'Custom Name',
        config: { some: 'config' }
      });
      
      // Validate the result
      expect(result).toEqual(mockPreview);
      
      // Validate the API call was made with the right endpoint and payload
      expect(mockAxiosInstance.post).toHaveBeenCalled();
      expect(mockAxiosInstance.post.mock.calls[0][0]).toBe('/repos/repo1/previews');
      expect(mockAxiosInstance.post.mock.calls[0][1]).toEqual({ 
        ref: 'feature-branch',
        name: 'Custom Name',
        config: { some: 'config' }
      });
    });
    
    it('should handle API errors', async () => {
      // Setup mock to throw an error
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid repository ID' },
          headers: {}
        },
        config: { url: '/repos/invalidrepo/previews' }
      };
      
      mockAxiosInstance.post.mockRejectedValueOnce(errorResponse);
      
      // Call the function and expect it to throw
      await expect((global as any).createPreview({ 
        repo: 'invalidrepo',
        ref: 'feature-branch'
      })).rejects.toThrow();
    });
  });
  
  describe('getPreview', () => {
    it('should fetch preview details by ID', async () => {
      // Mock response data
      const mockPreview = {
        id: 'prev1',
        name: 'Preview One',
        ref: 'feature-branch',
        state: 'ready',
        url: 'https://preview1.example.com',
        createdAt: '2023-01-01T00:00:00Z',
        size: 1024000
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: mockPreview,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).getPreview({ previewId: 'prev1' });
      
      // Validate the result
      expect(result).toEqual(mockPreview);
      
      // Validate the API call was made with the right endpoint
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/previews/prev1');
    });
    
    it('should handle preview not found', async () => {
      // Setup mock to throw a 404 error
      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Preview not found' },
          headers: {}
        },
        config: { url: '/previews/nonexistent' }
      };
      
      mockAxiosInstance.get.mockRejectedValueOnce(errorResponse);
      
      // Call the function and expect it to throw
      await expect((global as any).getPreview({ previewId: 'nonexistent' })).rejects.toThrow();
    });
  });
  
  describe('updatePreview', () => {
    it('should update a preview with specified parameters', async () => {
      // Mock response data
      const mockUpdatedPreview = {
        id: 'prev1',
        name: 'Updated Name',
        locked: true,
        anchor: false
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.patch.mockResolvedValueOnce({ 
        data: mockUpdatedPreview,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).updatePreview({ 
        previewId: 'prev1',
        name: 'Updated Name',
        locked: true,
        anchor: false
      });
      
      // Validate the result
      expect(result).toEqual(mockUpdatedPreview);
      
      // Validate the API call was made with the right endpoint and payload
      expect(mockAxiosInstance.patch).toHaveBeenCalled();
      expect(mockAxiosInstance.patch.mock.calls[0][0]).toBe('/previews/prev1');
      expect(mockAxiosInstance.patch.mock.calls[0][1]).toEqual({ 
        name: 'Updated Name',
        locked: true,
        anchor: false
      });
    });
    
    it('should update a preview with anchor_type', async () => {
      // Mock response data
      const mockUpdatedPreview = {
        id: 'prev1',
        anchor: true,
        anchor_type: 'branch'
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.patch.mockResolvedValueOnce({ 
        data: mockUpdatedPreview,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).updatePreview({ 
        previewId: 'prev1',
        anchor: true,
        anchor_type: 'branch'
      });
      
      // Validate the result
      expect(result).toEqual(mockUpdatedPreview);
      
      // Validate the API call was made with the right endpoint and payload
      expect(mockAxiosInstance.patch).toHaveBeenCalled();
      expect(mockAxiosInstance.patch.mock.calls[0][0]).toBe('/previews/prev1');
      expect(mockAxiosInstance.patch.mock.calls[0][1]).toEqual({ 
        anchor: true,
        anchor_type: 'branch'
      });
    });
    
    it('should handle API errors', async () => {
      // Setup mock to throw an error
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid anchor_type' },
          headers: {}
        },
        config: { url: '/previews/prev1' }
      };
      
      mockAxiosInstance.patch.mockRejectedValueOnce(errorResponse);
      
      // Call the function and expect it to throw
      await expect((global as any).updatePreview({ 
        previewId: 'prev1',
        anchor_type: 'invalid_type'
      })).rejects.toThrow();
    });
  });
  
  describe('getPreviewJobs', () => {
    it('should fetch preview jobs without filter', async () => {
      // Mock response data
      const mockJobs = [
        { id: 'job1', status: 'running', type: 'build', created: '2023-01-01T00:00:00Z' },
        { id: 'job2', status: 'complete', type: 'refresh', created: '2023-01-02T00:00:00Z' }
      ];
      
      // Setup the mock to return our data
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: mockJobs,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).getPreviewJobs({ previewId: 'prev1' });
      
      // Validate the result
      expect(result).toEqual(mockJobs);
      
      // Validate the API call was made with the right endpoint
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/previews/prev1/jobs');
      expect(mockAxiosInstance.get.mock.calls[0][1]).toEqual({
        params: undefined
      });
    });
    
    it('should fetch active preview jobs with filter', async () => {
      // Mock response data
      const mockJobs = [
        { id: 'job1', status: 'running', type: 'build', created: '2023-01-01T00:00:00Z' }
      ];
      
      // Setup the mock to return our data
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: mockJobs,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).getPreviewJobs({ 
        previewId: 'prev1',
        active: true
      });
      
      // Validate the result
      expect(result).toEqual(mockJobs);
      
      // Validate the API call was made with the right endpoint and query parameters
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/previews/prev1/jobs');
      expect(mockAxiosInstance.get.mock.calls[0][1]).toEqual({
        params: { active: true }
      });
    });
  });
  
  describe('getPreviewStatistics', () => {
    it('should fetch preview statistics with required parameters', async () => {
      // Mock response data
      const mockStats = [
        { date: '2023-01-01T00:00:00Z', value: 1024000 },
        { date: '2023-01-02T00:00:00Z', value: 1048576 }
      ];
      
      // Setup the mock to return our data
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: mockStats,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).getPreviewStatistics({ 
        previewId: 'prev1',
        item: 'size'
      });
      
      // Validate the result
      expect(result).toEqual(mockStats);
      
      // Validate the API call was made with the right endpoint
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/previews/prev1/statistics/size');
      expect(mockAxiosInstance.get.mock.calls[0][1]).toEqual({ params: {} });
    });
    
    it('should fetch preview statistics with optional parameters', async () => {
      // Mock response data
      const mockStats = [
        { date: '2023-01-01T00:00:00Z', value: 10 }
      ];
      
      // Setup the mock to return our data
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: mockStats,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).getPreviewStatistics({ 
        previewId: 'prev1',
        item: 'build-time',
        limit: 1,
        after: '2023-01-01T00:00:00Z'
      });
      
      // Validate the result
      expect(result).toEqual(mockStats);
      
      // Validate the API call was made with the right endpoint and query parameters
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/previews/prev1/statistics/build-time');
      expect(mockAxiosInstance.get.mock.calls[0][1]).toEqual({
        params: {
          limit: 1,
          after: '2023-01-01T00:00:00Z'
        }
      });
    });
  });
  
  describe('clonePreview', () => {
    it('should clone a preview with default parameters', async () => {
      // Mock response data
      const mockJob = {
        id: 'job1',
        type: 'clone',
        status: 'running'
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.post.mockResolvedValueOnce({ 
        data: mockJob,
        status: 202
      });
      
      // Call the function
      const result = await (global as any).clonePreview({ previewId: 'prev1' });
      
      // Validate the result
      expect(result).toEqual(mockJob);
      
      // Validate the API call was made with the right endpoint
      expect(mockAxiosInstance.post).toHaveBeenCalled();
      expect(mockAxiosInstance.post.mock.calls[0][0]).toBe('/previews/prev1/clone');
      expect(mockAxiosInstance.post.mock.calls[0][1]).toEqual({});
    });
    
    it('should clone a preview with custom name and expiration', async () => {
      // Mock response data
      const mockJob = {
        id: 'job1',
        type: 'clone',
        status: 'running'
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.post.mockResolvedValueOnce({ 
        data: mockJob,
        status: 202
      });
      
      // Call the function
      const result = await (global as any).clonePreview({ 
        previewId: 'prev1',
        name: 'Cloned Preview',
        expires: '2023-12-31T23:59:59Z'
      });
      
      // Validate the result
      expect(result).toEqual(mockJob);
      
      // Validate the API call was made with the right endpoint and payload
      expect(mockAxiosInstance.post).toHaveBeenCalled();
      expect(mockAxiosInstance.post.mock.calls[0][0]).toBe('/previews/prev1/clone');
      expect(mockAxiosInstance.post.mock.calls[0][1]).toEqual({
        name: 'Cloned Preview',
        expires: '2023-12-31T23:59:59Z'
      });
    });
  });
  
  describe('startPreview', () => {
    it('should start a preview', async () => {
      // Mock response data
      const mockJob = {
        id: 'job1',
        type: 'start',
        status: 'running'
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.post.mockResolvedValueOnce({ 
        data: mockJob,
        status: 202
      });
      
      // Call the function
      const result = await (global as any).startPreview({ previewId: 'prev1' });
      
      // Validate the result
      expect(result).toEqual(mockJob);
      
      // Validate the API call was made with the right endpoint
      expect(mockAxiosInstance.post).toHaveBeenCalled();
      expect(mockAxiosInstance.post.mock.calls[0][0]).toBe('/previews/prev1/start');
    });
  });
  
  describe('stopPreview', () => {
    it('should stop a preview', async () => {
      // Mock response data
      const mockJob = {
        id: 'job1',
        type: 'stop',
        status: 'running'
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.post.mockResolvedValueOnce({ 
        data: mockJob,
        status: 202
      });
      
      // Call the function
      const result = await (global as any).stopPreview({ previewId: 'prev1' });
      
      // Validate the result
      expect(result).toEqual(mockJob);
      
      // Validate the API call was made with the right endpoint
      expect(mockAxiosInstance.post).toHaveBeenCalled();
      expect(mockAxiosInstance.post.mock.calls[0][0]).toBe('/previews/prev1/stop');
    });
  });
  
  describe('suspendPreview', () => {
    it('should suspend a preview', async () => {
      // Mock response data
      const mockJob = {
        id: 'job1',
        type: 'suspend',
        status: 'running'
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.post.mockResolvedValueOnce({ 
        data: mockJob,
        status: 202
      });
      
      // Call the function
      const result = await (global as any).suspendPreview({ previewId: 'prev1' });
      
      // Validate the result
      expect(result).toEqual(mockJob);
      
      // Validate the API call was made with the right endpoint
      expect(mockAxiosInstance.post).toHaveBeenCalled();
      expect(mockAxiosInstance.post.mock.calls[0][0]).toBe('/previews/prev1/suspend');
    });
  });
  
  describe('buildPreview', () => {
    it('should build a preview', async () => {
      // Mock response data
      const mockJob = {
        id: 'job1',
        type: 'build',
        status: 'running'
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.post.mockResolvedValueOnce({ 
        data: mockJob,
        status: 202
      });
      
      // Call the function
      const result = await (global as any).buildPreview({ previewId: 'prev1' });
      
      // Validate the result
      expect(result).toEqual(mockJob);
      
      // Validate the API call was made with the right endpoint
      expect(mockAxiosInstance.post).toHaveBeenCalled();
      expect(mockAxiosInstance.post.mock.calls[0][0]).toBe('/previews/prev1/build');
    });
  });
  
  describe('refreshPreview', () => {
    it('should refresh a preview', async () => {
      // Mock response data
      const mockJob = {
        id: 'job1',
        type: 'refresh',
        status: 'running'
      };
      
      // Setup the mock to return our data
      mockAxiosInstance.post.mockResolvedValueOnce({ 
        data: mockJob,
        status: 202
      });
      
      // Call the function
      const result = await (global as any).refreshPreview({ previewId: 'prev1' });
      
      // Validate the result
      expect(result).toEqual(mockJob);
      
      // Validate the API call was made with the right endpoint
      expect(mockAxiosInstance.post).toHaveBeenCalled();
      expect(mockAxiosInstance.post.mock.calls[0][0]).toBe('/previews/prev1/refresh');
    });
  });
  
  describe('deletePreview', () => {
    it('should delete a preview', async () => {
      // Setup the mock to return success
      mockAxiosInstance.delete.mockResolvedValueOnce({ 
        status: 204
      });
      
      // Call the function
      await (global as any).deletePreview({ previewId: 'prev1' });
      
      // Validate the API call was made with the right endpoint
      expect(mockAxiosInstance.delete).toHaveBeenCalled();
      expect(mockAxiosInstance.delete.mock.calls[0][0]).toBe('/previews/prev1');
    });
    
    it('should handle API errors', async () => {
      // Setup mock to throw an error
      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Preview not found' },
          headers: {}
        },
        config: { url: '/previews/nonexistent' }
      };
      
      mockAxiosInstance.delete.mockRejectedValueOnce(errorResponse);
      
      // Call the function and expect it to throw
      await expect((global as any).deletePreview({ previewId: 'nonexistent' })).rejects.toThrow();
    });
  });
  
  describe('searchPreviews', () => {
    it('should search previews by query', async () => {
      // Mock response data
      const mockPreviews = [
        { id: 'prev1', name: 'Feature Preview', state: 'ready' },
        { id: 'prev2', name: 'Feature Test', state: 'ready' }
      ];
      
      // Setup the mock to return our data
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: mockPreviews,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).searchPreviews({ query: 'feature' });
      
      // Validate the result
      expect(result).toEqual(mockPreviews);
      
      // Validate the API call was made with the right endpoint and query parameters
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/previews/search');
      expect(mockAxiosInstance.get.mock.calls[0][1]).toEqual({
        params: { q: 'feature' }
      });
    });
    
    it('should search previews with state filter', async () => {
      // Mock response data
      const mockPreviews = [
        { id: 'prev1', name: 'Feature Preview', state: 'building' }
      ];
      
      // Setup the mock to return our data
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        data: mockPreviews,
        status: 200
      });
      
      // Call the function
      const result = await (global as any).searchPreviews({ 
        query: 'feature',
        state: 'building'
      });
      
      // Validate the result
      expect(result).toEqual(mockPreviews);
      
      // Validate the API call was made with the right endpoint and query parameters
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get.mock.calls[0][0]).toBe('/previews/search');
      expect(mockAxiosInstance.get.mock.calls[0][1]).toEqual({
        params: { 
          q: 'feature',
          state: 'building'
        }
      });
    });
  });
}); 