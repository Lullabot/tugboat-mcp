"use strict";
/**
 * Authentication utilities for the Tugboat MCP server
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthManager = exports.AuthTokenSchema = void 0;
const zod_1 = require("zod");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Authentication token schema
 */
exports.AuthTokenSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    expires: zod_1.z.number().optional()
});
// Default logger that writes to file
const logFile = path.join(__dirname, "../../logs/auth.log");
const logDir = path.dirname(logFile);
// Create log directory if it doesn't exist
try {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
}
catch (err) {
    // Silent failure for logging setup
}
// Default logger function
const defaultLogger = {
    log: (message) => {
        try {
            fs.appendFileSync(logFile, `${new Date().toISOString()} [INFO] ${message}\n`);
        }
        catch (err) {
            // Silent failure
        }
    },
    error: (message) => {
        try {
            fs.appendFileSync(logFile, `${new Date().toISOString()} [ERROR] ${message}\n`);
        }
        catch (err) {
            // Silent failure
        }
    }
};
/**
 * Authentication manager class
 */
class AuthManager {
    constructor(apiClient, logger = defaultLogger) {
        this.token = null;
        this.tokenRefreshPromise = null;
        this.apiClient = apiClient;
        this.logger = logger;
    }
    /**
     * Authenticate with the Tugboat API
     *
     * @returns A promise that resolves to the authentication token
     */
    async authenticate() {
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
            }
            finally {
                this.tokenRefreshPromise = null;
            }
        }
        catch (error) {
            this.logger.error(`Failed to authenticate with Tugboat API: ${error.message || 'Unknown error'}`);
            throw new Error('Authentication failed');
        }
    }
    /**
     * Refresh the authentication token
     *
     * @returns A promise that resolves to the new authentication token
     */
    async refreshToken() {
        // The Tugboat API uses API key authentication, so the token is just the API key.
        // In a real implementation with token-based auth, you would make an API call here to refresh the token.
        // For now, we'll just create a simple token with the API key
        const token = {
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
    async isAuthorized(resource, action) {
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
    async getAuthHeaders() {
        const token = await this.authenticate();
        return {
            'Authorization': `Bearer ${token.token}`
        };
    }
}
exports.AuthManager = AuthManager;
