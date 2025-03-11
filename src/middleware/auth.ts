/**
 * Authentication middleware for the HTTP transport
 */
import { Request, Response, NextFunction } from 'express';
import { AuthManager } from '../utils/auth';
import { TugboatApiClient } from '../utils/api-client';

/**
 * Authentication middleware factory
 * 
 * @param authManager The authentication manager
 * @returns An Express middleware function
 */
export function createAuthMiddleware(authManager: AuthManager) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check for authentication header
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        // No authentication header, require authentication
        res.status(401).json({
          error: 'Authentication required',
          message: 'No authorization header provided'
        });
        return;
      }
      
      // Extract the token from the header
      const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
      if (!tokenMatch) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Invalid authorization header format'
        });
        return;
      }
      
      const token = tokenMatch[1];
      
      // Check if the token matches our expected token
      const validToken = await authManager.authenticate();
      if (token !== validToken.token) {
        res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid authentication token'
        });
        return;
      }
      
      // Check resource authorization if requested
      if (req.params.resource) {
        const action = getActionFromMethod(req.method);
        const isAuthorized = await authManager.isAuthorized(req.params.resource, action);
        
        if (!isAuthorized) {
          res.status(403).json({
            error: 'Authorization failed',
            message: `You do not have permission to ${action} this resource`
          });
          return;
        }
      }
      
      // Authentication and authorization successful
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({
        error: 'Authentication error',
        message: 'An error occurred during authentication'
      });
    }
  };
}

/**
 * Get the action type from HTTP method
 * 
 * @param method The HTTP method
 * @returns The action type
 */
function getActionFromMethod(method: string): 'read' | 'write' | 'delete' {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'read';
    case 'POST':
    case 'PUT':
    case 'PATCH':
      return 'write';
    case 'DELETE':
      return 'delete';
    default:
      return 'read';
  }
} 