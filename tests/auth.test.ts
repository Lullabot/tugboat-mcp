import { AuthManager, AuthToken } from '../src/utils/auth';
import { TugboatApiClient } from '../src/utils/api-client';
import { createAuthMiddleware } from '../src/middleware/auth';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// Mock the fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  appendFileSync: jest.fn()
}));

// Mock the axios module used by TugboatApiClient
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

// Custom mock logger for testing
const mockLogger = {
  log: jest.fn(),
  error: jest.fn()
};

describe('AuthManager', () => {
  let apiClient: TugboatApiClient;
  let authManager: AuthManager;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a new API client with a test API key
    apiClient = new TugboatApiClient('test-api-key', 'https://api.test.com', false);
    
    // Create a new auth manager with the API client and mock logger
    authManager = new AuthManager(apiClient, mockLogger);
  });
  
  test('should authenticate and return a token', async () => {
    // Call authenticate
    const token = await authManager.authenticate();
    
    // Check that the token has the correct structure
    expect(token).toBeDefined();
    expect(token.token).toBe('test-api-key');
    
    // Check that the logger was called
    expect(mockLogger.log).toHaveBeenCalledWith('Refreshing auth token');
    expect(mockLogger.log).toHaveBeenCalledWith('Auth token refreshed successfully');
  });
  
  test('should reuse existing token if valid', async () => {
    // First call to authenticate
    await authManager.authenticate();
    
    // Reset mock to check calls during second authenticate
    mockLogger.log.mockClear();
    
    // Second call to authenticate
    await authManager.authenticate();
    
    // Check that we used the existing token
    expect(mockLogger.log).toHaveBeenCalledWith('Using existing auth token');
    
    // The refreshing logs shouldn't be called
    expect(mockLogger.log).not.toHaveBeenCalledWith('Refreshing auth token');
  });
  
  test('should authorize all actions', async () => {
    // Check authorization for different resources and actions
    const readAuth = await authManager.isAuthorized('projects', 'read');
    const writeAuth = await authManager.isAuthorized('previews', 'write');
    const deleteAuth = await authManager.isAuthorized('repositories', 'delete');
    
    // All should be authorized
    expect(readAuth).toBe(true);
    expect(writeAuth).toBe(true);
    expect(deleteAuth).toBe(true);
    
    // Check logger calls
    expect(mockLogger.log).toHaveBeenCalledWith('Authorization check for read on projects: granted');
    expect(mockLogger.log).toHaveBeenCalledWith('Authorization check for write on previews: granted');
    expect(mockLogger.log).toHaveBeenCalledWith('Authorization check for delete on repositories: granted');
  });
  
  test('should provide auth headers', async () => {
    // Get auth headers
    const headers = await authManager.getAuthHeaders();
    
    // Check headers structure
    expect(headers).toEqual({
      'Authorization': 'Bearer test-api-key'
    });
  });
});

describe('Auth Middleware', () => {
  let authManager: AuthManager;
  let middleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create test api client and auth manager
    const apiClient = new TugboatApiClient('test-api-key', 'https://api.test.com', false);
    authManager = new AuthManager(apiClient, mockLogger);
    
    // Mock authenticate method to return a known token
    jest.spyOn(authManager, 'authenticate').mockResolvedValue({ token: 'test-token' });
    jest.spyOn(authManager, 'isAuthorized').mockResolvedValue(true);
    
    // Create the middleware
    middleware = createAuthMiddleware(authManager);
    
    // Setup request, response and next function
    req = {
      headers: {},
      params: {},
      method: 'GET'
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
  });
  
  test('should reject requests without authorization header', async () => {
    // Call middleware with no auth header
    await middleware(req as Request, res as Response, next as NextFunction);
    
    // Should return 401
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication required',
      message: 'No authorization header provided'
    });
    expect(next).not.toHaveBeenCalled();
  });
  
  test('should reject requests with invalid authorization format', async () => {
    // Call middleware with invalid auth format
    req.headers = { authorization: 'InvalidFormat token123' };
    await middleware(req as Request, res as Response, next as NextFunction);
    
    // Should return 401
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication required',
      message: 'Invalid authorization header format'
    });
    expect(next).not.toHaveBeenCalled();
  });
  
  test('should reject requests with invalid token', async () => {
    // Call middleware with invalid token
    req.headers = { authorization: 'Bearer invalid-token' };
    await middleware(req as Request, res as Response, next as NextFunction);
    
    // Should return 401
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication failed',
      message: 'Invalid authentication token'
    });
    expect(next).not.toHaveBeenCalled();
  });
  
  test('should authorize valid requests', async () => {
    // Call middleware with valid token
    req.headers = { authorization: 'Bearer test-token' };
    await middleware(req as Request, res as Response, next as NextFunction);
    
    // Should call next()
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
  
  test('should check resource authorization', async () => {
    // Call middleware with valid token and resource param
    req.headers = { authorization: 'Bearer test-token' };
    req.params = { resource: 'projects' };
    req.method = 'GET';
    
    await middleware(req as Request, res as Response, next as NextFunction);
    
    // Should call isAuthorized with the resource and 'read' action
    expect(authManager.isAuthorized).toHaveBeenCalledWith('projects', 'read');
    expect(next).toHaveBeenCalled();
  });
  
  test('should reject unauthorized resource access', async () => {
    // Mock isAuthorized to return false
    (authManager.isAuthorized as jest.Mock).mockResolvedValueOnce(false);
    
    // Call middleware with valid token but unauthorized resource
    req.headers = { authorization: 'Bearer test-token' };
    req.params = { resource: 'admin' };
    req.method = 'DELETE';
    
    await middleware(req as Request, res as Response, next as NextFunction);
    
    // Should call isAuthorized with the resource and 'delete' action
    expect(authManager.isAuthorized).toHaveBeenCalledWith('admin', 'delete');
    
    // Should return 403
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authorization failed',
      message: 'You do not have permission to delete this resource'
    });
    expect(next).not.toHaveBeenCalled();
  });
  
  test('should map HTTP methods to correct actions', async () => {
    req.headers = { authorization: 'Bearer test-token' };
    req.params = { resource: 'test' };
    
    // Test GET -> read
    req.method = 'GET';
    await middleware(req as Request, res as Response, next as NextFunction);
    expect(authManager.isAuthorized).toHaveBeenCalledWith('test', 'read');
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Test POST -> write
    req.method = 'POST';
    await middleware(req as Request, res as Response, next as NextFunction);
    expect(authManager.isAuthorized).toHaveBeenCalledWith('test', 'write');
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Test PUT -> write
    req.method = 'PUT';
    await middleware(req as Request, res as Response, next as NextFunction);
    expect(authManager.isAuthorized).toHaveBeenCalledWith('test', 'write');
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Test DELETE -> delete
    req.method = 'DELETE';
    await middleware(req as Request, res as Response, next as NextFunction);
    expect(authManager.isAuthorized).toHaveBeenCalledWith('test', 'delete');
  });
}); 