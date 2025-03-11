"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TugboatApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Tugboat API Client
 *
 * A utility class for interacting with the Tugboat API.
 */
class TugboatApiClient {
    /**
     * Create a new Tugboat API client
     *
     * @param apiKey The Tugboat API key to use for authentication
     * @param baseUrl The base URL for the Tugboat API (defaults to production API)
     * @param debug Enable debug mode for detailed logging (defaults to false)
     */
    constructor(apiKey, baseUrl = 'https://api.tugboatqa.com/v3', debug = false) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.debugMode = debug;
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        if (this.debugMode) {
            console.log(`TugboatApiClient initialized with base URL: ${this.baseUrl}`);
        }
    }
    /**
     * Get the API key used for authentication
     *
     * @returns The API key
     */
    getApiKey() {
        return this.apiKey;
    }
    /**
     * Update the authorization headers for the API client
     *
     * @param authHeaders New authorization headers
     */
    updateAuthHeaders(authHeaders) {
        // Update the default headers in the Axios client
        Object.entries(authHeaders).forEach(([key, value]) => {
            this.client.defaults.headers.common[key] = value;
        });
    }
    /**
     * Enable or disable debug mode
     *
     * @param enabled Whether debug mode should be enabled
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
    /**
     * Make a GET request to the Tugboat API
     *
     * @param endpoint The API endpoint to request
     * @param config Optional Axios request configuration
     * @returns The API response data
     */
    async get(endpoint, config) {
        try {
            if (this.debugMode) {
                console.log(`API GET request to ${endpoint}`);
                console.log('Request config:', config);
            }
            const response = await this.client.get(endpoint, config);
            // Validate JSON response
            if (response.data && typeof response.data === 'string') {
                try {
                    // If data is a string, try to parse it as JSON
                    response.data = JSON.parse(response.data);
                }
                catch (jsonError) {
                    if (this.debugMode) {
                        console.error(`JSON parsing error for ${endpoint}:`, jsonError);
                        console.error(`Raw response data: ${response.data?.substring(0, 500)}...`);
                    }
                    throw new Error(`Failed to parse JSON response from ${endpoint}: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
                }
            }
            if (this.debugMode) {
                console.log(`API GET response from ${endpoint}:`, {
                    status: response.status,
                    headers: response.headers,
                    data: typeof response.data === 'object'
                        ? '[Complex Object]'
                        : response.data
                });
            }
            return response.data;
        }
        catch (error) {
            if (this.debugMode) {
                console.error(`API GET error for ${endpoint}:`, error);
            }
            this.handleApiError(error);
        }
    }
    /**
     * Make a POST request to the Tugboat API
     *
     * @param endpoint The API endpoint to request
     * @param data The data to send in the request body
     * @param config Optional Axios request configuration
     * @returns The API response data
     */
    async post(endpoint, data, config) {
        try {
            if (this.debugMode) {
                console.log(`API POST request to ${endpoint}`);
                console.log('Request data:', data);
                console.log('Request config:', config);
            }
            const response = await this.client.post(endpoint, data, config);
            if (this.debugMode) {
                console.log(`API POST response from ${endpoint}:`, {
                    status: response.status,
                    headers: response.headers,
                    data: response.data
                });
            }
            return response.data;
        }
        catch (error) {
            if (this.debugMode) {
                console.error(`API POST error for ${endpoint}:`, error);
            }
            this.handleApiError(error);
        }
    }
    /**
     * Make a PATCH request to the Tugboat API
     *
     * @param endpoint The API endpoint to request
     * @param data The data to send in the request body
     * @param config Optional Axios request configuration
     * @returns The API response data
     */
    async patch(endpoint, data, config) {
        try {
            if (this.debugMode) {
                console.log(`API PATCH request to ${endpoint}`);
                console.log('Request data:', data);
                console.log('Request config:', config);
            }
            const response = await this.client.patch(endpoint, data, config);
            if (this.debugMode) {
                console.log(`API PATCH response from ${endpoint}:`, {
                    status: response.status,
                    headers: response.headers,
                    data: response.data
                });
            }
            return response.data;
        }
        catch (error) {
            if (this.debugMode) {
                console.error(`API PATCH error for ${endpoint}:`, error);
            }
            this.handleApiError(error);
        }
    }
    /**
     * Make a DELETE request to the Tugboat API
     *
     * @param endpoint The API endpoint to request
     * @param config Optional Axios request configuration
     * @returns The API response data
     */
    async delete(endpoint, config) {
        try {
            if (this.debugMode) {
                console.log(`API DELETE request to ${endpoint}`);
                console.log('Request config:', config);
            }
            const response = await this.client.delete(endpoint, config);
            if (this.debugMode) {
                console.log(`API DELETE response from ${endpoint}:`, {
                    status: response.status,
                    headers: response.headers,
                    data: response.data
                });
            }
            return response.data;
        }
        catch (error) {
            if (this.debugMode) {
                console.error(`API DELETE error for ${endpoint}:`, error);
            }
            this.handleApiError(error);
        }
    }
    /**
     * Handle API errors by throwing an enhanced error with more context
     */
    handleApiError(error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            const errorMessage = error.response.data?.message || 'Unknown API error';
            const statusCode = error.response.status;
            if (this.debugMode) {
                console.error('API error response:', {
                    status: statusCode,
                    data: error.response.data,
                    headers: error.response.headers
                });
            }
            if (statusCode === 401) {
                throw new Error('Tugboat API Error: Authentication failed. Please check your API key.');
            }
            else if (statusCode === 403) {
                throw new Error('Tugboat API Error: Authorization failed. You do not have permission to perform this action.');
            }
            else if (statusCode === 404) {
                throw new Error(`Tugboat API Error: Resource not found at ${error.config?.url || 'unknown endpoint'}`);
            }
            else {
                throw new Error(`Tugboat API Error (${statusCode}): ${errorMessage}`);
            }
        }
        else if (error.request) {
            // The request was made but no response was received
            if (this.debugMode) {
                console.error('API request made but no response received:', error.request);
            }
            throw new Error('Tugboat API Error: No response received from server');
        }
        else {
            // Something happened in setting up the request that triggered an Error
            if (this.debugMode) {
                console.error('API request setup error:', error.message);
            }
            throw new Error(`Tugboat API Error: ${error.message}`);
        }
    }
}
exports.TugboatApiClient = TugboatApiClient;
