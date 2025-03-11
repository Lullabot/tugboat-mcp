/**
 * Authentication utilities for the Tugboat MCP server
 */

import { z } from 'zod';
import { TugboatApiClient } from './api-client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Authentication token schema
 */
export const AuthTokenSchema = z.object({
  token: z.string().min(1),
  expires: z.number().optional()
});

export type AuthToken = z.infer<typeof AuthTokenSchema>;

// Logger interface
interface Logger {
  log: (message: string) => void;
  error: (message: string) => void;
}

// Default logger that writes to file
const logFile = path.join(__dirname, "../../logs/auth.log");
const logDir = path.dirname(logFile);

// Create log directory if it doesn't exist
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (err) {
  // Silent failure for logging setup
}

// Default logger function
const defaultLogger: Logger = {
  log: (message: string) => {
    try {
      fs.appendFileSync(logFile, `${new Date().toISOString()} [INFO] ${message}\n`);
    } catch (err) {
      // Silent failure
    }
  },
  error: (message: string) => {
    try {
      fs.appendFileSync(logFile, `${new Date().toISOString()} [ERROR] ${message}\n`);
    } catch (err) {
      // Silent failure
    }
  }
};

/**
 * Authentication manager class
 */
export class AuthManager {
  private apiClient: TugboatApiClient;
  private token: AuthToken | null = null;
  private tokenRefreshPromise: Promise<AuthToken> | null = null;
  private logger: Logger;

  constructor(apiClient: TugboatApiClient, logger: Logger = defaultLogger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  /**
   * Authenticate with the Tugboat API
   * 
   * @returns A promise that resolves to the authentication token
   */
  async authenticate(): Promise<AuthToken> {
    try {
      // If we already have a token, return it
      if (this.token && (!this.token.expires || this.token.expires > Date.now())) {
        this.logger.log("Using existing auth token");
        return this.token;
      }

      // If we're already refreshing the token, return that promise
      if (this.tokenRefreshPromise) {
        this.logger.log("Token refresh already in progress, waiting...");
        return this.tokenRefreshPromise;
      }

      // Otherwise, refresh the token
      this.logger.log("Refreshing auth token");
      this.tokenRefreshPromise = this.refreshToken();

      try {
        this.token = await this.tokenRefreshPromise;
        this.logger.log("Auth token refreshed successfully");
        return this.token;
      } finally {
        this.tokenRefreshPromise = null;
      }
    } catch (error: any) {
      this.logger.error(`Failed to authenticate with Tugboat API: ${error.message || 'Unknown error'}`);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Refresh the authentication token
   * 
   * @returns A promise that resolves to the new authentication token
   */
  private async refreshToken(): Promise<AuthToken> {
    // The Tugboat API uses API key authentication, so the token is just the API key.
    // In a real implementation with token-based auth, you would make an API call here to refresh the token.
    
    // For now, we'll just create a simple token with the API key
    const token: AuthToken = {
      token: this.apiClient.getApiKey(),
      // No expiration for API key auth
    };

    return token;
  }

  /**
   * Check if the user is authorized to perform an action
   * 
   * @param resource The resource to check authorization for
   * @param action The action to check authorization for
   * @returns A promise that resolves to true if authorized, false otherwise
   */
  async isAuthorized(resource: string, action: 'read' | 'write' | 'delete'): Promise<boolean> {
    // Ensure we have a valid token
    await this.authenticate();

    // For simplicity in this implementation, we'll authorize all actions
    // In a real implementation, you would check the user's permissions for the specific resource and action
    this.logger.log(`Authorization check for ${action} on ${resource}: granted`);
    return true;
  }

  /**
   * Get authorization headers for API requests
   * 
   * @returns Authorization headers for API requests
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.authenticate();
    return {
      'Authorization': `Bearer ${token.token}`
    };
  }
} 