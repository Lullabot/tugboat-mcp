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
}); 