import { TugboatApiClient } from '../src/utils/api-client';
import axios from 'axios';

// Mock axios
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

describe('TugboatApiClient', () => {
  let apiClient: TugboatApiClient;
  let mockAxiosCreate: jest.Mock;
  let mockAxiosInstance: any;
  
  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Setup mock axios create function and instance
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
    
    mockAxiosCreate = axios.create as jest.Mock;
    mockAxiosCreate.mockReturnValue(mockAxiosInstance);
    
    // Create api client for testing
    apiClient = new TugboatApiClient('test-api-key', 'https://api.test.com');
  });
  
  test('should initialize with correct base URL and headers', () => {
    // Check that axios.create was called with the right config
    expect(mockAxiosCreate).toHaveBeenCalledWith({
      baseURL: 'https://api.test.com',
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  });
  
  test('should return API key', () => {
    const apiKey = apiClient.getApiKey();
    expect(apiKey).toBe('test-api-key');
  });
  
  test('should update auth headers', () => {
    // Update auth headers
    const newHeaders = { 'Authorization': 'Bearer new-token' };
    apiClient.updateAuthHeaders(newHeaders);
    
    // Check that the headers were updated
    expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe('Bearer new-token');
  });
  
  test('should handle GET requests with authorization', async () => {
    // Setup mock response
    const mockResponse = {
      data: { success: true },
      status: 200,
      headers: {}
    };
    mockAxiosInstance.get.mockResolvedValue(mockResponse);
    
    // Make GET request
    const result = await apiClient.get('/projects');
    
    // Check that the request was made correctly
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/projects', undefined);
    
    // Check that the result matches the mock response data
    expect(result).toEqual({ success: true });
  });
  
  test('should handle POST requests with authorization', async () => {
    // Setup mock response
    const mockResponse = {
      data: { id: '123', name: 'New Project' },
      status: 201,
      headers: {}
    };
    mockAxiosInstance.post.mockResolvedValue(mockResponse);
    
    // Data to send
    const postData = { name: 'New Project' };
    
    // Make POST request
    const result = await apiClient.post('/projects', postData);
    
    // Check that the request was made correctly
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/projects', postData, undefined);
    
    // Check that the result matches the mock response data
    expect(result).toEqual({ id: '123', name: 'New Project' });
  });
  
  test('should handle PATCH requests with authorization', async () => {
    // Setup mock response
    const mockResponse = {
      data: { id: '123', name: 'Updated Project' },
      status: 200,
      headers: {}
    };
    mockAxiosInstance.patch.mockResolvedValue(mockResponse);
    
    // Data to send
    const patchData = { name: 'Updated Project' };
    
    // Make PATCH request
    const result = await apiClient.patch('/projects/123', patchData);
    
    // Check that the request was made correctly
    expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/projects/123', patchData, undefined);
    
    // Check that the result matches the mock response data
    expect(result).toEqual({ id: '123', name: 'Updated Project' });
  });
  
  test('should handle DELETE requests with authorization', async () => {
    // Setup mock response
    const mockResponse = {
      data: { success: true },
      status: 204,
      headers: {}
    };
    mockAxiosInstance.delete.mockResolvedValue(mockResponse);
    
    // Make DELETE request
    const result = await apiClient.delete('/projects/123');
    
    // Check that the request was made correctly
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/projects/123', undefined);
    
    // Check that the result matches the mock response data
    expect(result).toEqual({ success: true });
  });
  
  test('should handle 401 authentication errors', async () => {
    // Create error response with 401 status
    const errorResponse = {
      response: {
        status: 401,
        data: { message: 'Invalid API key' },
        headers: {}
      },
      config: { url: '/projects' }
    };
    
    // Make the get method throw the error
    mockAxiosInstance.get.mockRejectedValue(errorResponse);
    
    // Call API and expect it to throw an error
    await expect(apiClient.get('/projects')).rejects.toThrow(
      'Tugboat API Error: Authentication failed. Please check your API key.'
    );
  });
  
  test('should handle 403 authorization errors', async () => {
    // Create error response with 403 status
    const errorResponse = {
      response: {
        status: 403,
        data: { message: 'Forbidden' },
        headers: {}
      },
      config: { url: '/admin/users' }
    };
    
    // Make the get method throw the error
    mockAxiosInstance.get.mockRejectedValue(errorResponse);
    
    // Call API and expect it to throw an error
    await expect(apiClient.get('/admin/users')).rejects.toThrow(
      'Tugboat API Error: Authorization failed. You do not have permission to perform this action.'
    );
  });

  // Repository methods tests
  test('should get repository details', async () => {
    const mockResponse = {
      data: { 
        repository: { 
          id: 'repo123', 
          name: 'Test Repo',
          provider: 'github',
          url: 'https://github.com/test/repo'
        } 
      },
      status: 200,
      headers: {}
    };
    mockAxiosInstance.get.mockResolvedValue(mockResponse);
    
    const result = await apiClient.getRepository('repo123');
    
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/repositories/repo123', undefined);
    expect(result).toEqual(mockResponse.data);
  });

  test('should create a repository', async () => {
    const mockResponse = {
      data: { 
        repository: { 
          id: 'repo123', 
          name: 'New Repo',
          provider: 'github',
          url: 'https://github.com/test/repo',
          private: true
        } 
      },
      status: 201,
      headers: {}
    };
    mockAxiosInstance.post.mockResolvedValue(mockResponse);
    
    const result = await apiClient.createRepository(
      'project123',
      'New Repo',
      'github',
      'https://github.com/test/repo',
      true,
      { basePreview: 'preview123' }
    );
    
    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/projects/project123/repositories',
      {
        name: 'New Repo',
        provider: 'github',
        url: 'https://github.com/test/repo',
        private: true,
        buildSettings: { basePreview: 'preview123' }
      },
      undefined
    );
    expect(result).toEqual(mockResponse.data);
  });

  test('should update a repository', async () => {
    const mockResponse = {
      data: { 
        repository: { 
          id: 'repo123', 
          name: 'Updated Repo'
        } 
      },
      status: 200,
      headers: {}
    };
    mockAxiosInstance.patch.mockResolvedValue(mockResponse);
    
    const updateData = { name: 'Updated Repo' };
    const result = await apiClient.updateRepository('repo123', updateData);
    
    expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/repositories/repo123', updateData, undefined);
    expect(result).toEqual(mockResponse.data);
  });

  test('should delete a repository', async () => {
    const mockResponse = {
      data: { success: true },
      status: 204,
      headers: {}
    };
    mockAxiosInstance.delete.mockResolvedValue(mockResponse);
    
    const result = await apiClient.deleteRepository('repo123');
    
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/repositories/repo123', undefined);
    expect(result).toEqual(mockResponse.data);
  });

  test('should get repository branches', async () => {
    const mockResponse = {
      data: { 
        branches: [
          { name: 'main', commit: 'abc123' },
          { name: 'develop', commit: 'def456' }
        ] 
      },
      status: 200,
      headers: {}
    };
    mockAxiosInstance.get.mockResolvedValue(mockResponse);
    
    const result = await apiClient.getRepositoryBranches('repo123');
    
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/repositories/repo123/branches', undefined);
    expect(result).toEqual(mockResponse.data);
  });

  test('should get repository pull requests', async () => {
    const mockResponse = {
      data: { 
        pullRequests: [
          { number: 1, title: 'Feature A', author: 'user1', state: 'open', url: 'https://github.com/test/repo/pull/1' },
          { number: 2, title: 'Feature B', author: 'user2', state: 'closed', url: 'https://github.com/test/repo/pull/2' }
        ] 
      },
      status: 200,
      headers: {}
    };
    mockAxiosInstance.get.mockResolvedValue(mockResponse);
    
    const result = await apiClient.getRepositoryPullRequests('repo123');
    
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/repositories/repo123/pull-requests', undefined);
    expect(result).toEqual(mockResponse.data);
  });

  // Search methods tests
  test('should search for previews', async () => {
    const mockResponse = {
      data: { 
        previews: [
          { id: 'preview1', name: 'Feature Branch', status: 'ready' },
          { id: 'preview2', name: 'Main Branch', status: 'building' }
        ] 
      },
      status: 200,
      headers: {}
    };
    mockAxiosInstance.get.mockResolvedValue(mockResponse);
    
    const params = { query: 'feature', state: 'ready', limit: 10 };
    const result = await apiClient.searchPreviews(params);
    
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/previews', { params });
    expect(result).toEqual(mockResponse.data);
  });

  test('should search for projects', async () => {
    const mockResponse = {
      data: { 
        projects: [
          { id: 'project1', name: 'Frontend App' },
          { id: 'project2', name: 'Backend API' }
        ] 
      },
      status: 200,
      headers: {}
    };
    mockAxiosInstance.get.mockResolvedValue(mockResponse);
    
    const params = { query: 'app', limit: 10 };
    const result = await apiClient.searchProjects(params);
    
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/projects', { params });
    expect(result).toEqual(mockResponse.data);
  });

  test('should search for repositories', async () => {
    const mockResponse = {
      data: { 
        repositories: [
          { id: 'repo1', name: 'frontend-repo', provider: 'github' },
          { id: 'repo2', name: 'backend-repo', provider: 'gitlab' }
        ] 
      },
      status: 200,
      headers: {}
    };
    mockAxiosInstance.get.mockResolvedValue(mockResponse);
    
    const params = { query: 'repo', projectId: 'project1', limit: 10 };
    const result = await apiClient.searchRepositories(params);
    
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/repositories', { params });
    expect(result).toEqual(mockResponse.data);
  });
}); 