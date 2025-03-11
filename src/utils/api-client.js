"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
     */
    constructor(apiKey, baseUrl = 'https://api.tugboatqa.com/v3') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }
    /**
     * Make a GET request to the Tugboat API
     *
     * @param endpoint The API endpoint to request
     * @param config Optional Axios request configuration
     * @returns The API response data
     */
    get(endpoint, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.get(endpoint, config);
                return response.data;
            }
            catch (error) {
                this.handleApiError(error);
            }
        });
    }
    /**
     * Make a POST request to the Tugboat API
     *
     * @param endpoint The API endpoint to request
     * @param data The data to send in the request body
     * @param config Optional Axios request configuration
     * @returns The API response data
     */
    post(endpoint, data, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.post(endpoint, data, config);
                return response.data;
            }
            catch (error) {
                this.handleApiError(error);
            }
        });
    }
    /**
     * Make a PATCH request to the Tugboat API
     *
     * @param endpoint The API endpoint to request
     * @param data The data to send in the request body
     * @param config Optional Axios request configuration
     * @returns The API response data
     */
    patch(endpoint, data, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.patch(endpoint, data, config);
                return response.data;
            }
            catch (error) {
                this.handleApiError(error);
            }
        });
    }
    /**
     * Make a DELETE request to the Tugboat API
     *
     * @param endpoint The API endpoint to request
     * @param config Optional Axios request configuration
     * @returns The API response data
     */
    delete(endpoint, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.delete(endpoint, config);
                return response.data;
            }
            catch (error) {
                this.handleApiError(error);
            }
        });
    }
    /**
     * Handle API errors by throwing an enhanced error with more context
     */
    handleApiError(error) {
        var _a;
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            const errorMessage = ((_a = error.response.data) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown API error';
            const statusCode = error.response.status;
            throw new Error(`Tugboat API Error (${statusCode}): ${errorMessage}`);
        }
        else if (error.request) {
            // The request was made but no response was received
            throw new Error('Tugboat API Error: No response received from server');
        }
        else {
            // Something happened in setting up the request that triggered an Error
            throw new Error(`Tugboat API Error: ${error.message}`);
        }
    }
}
exports.TugboatApiClient = TugboatApiClient;
