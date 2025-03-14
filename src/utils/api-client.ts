import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * Tugboat API Client
 * 
 * A utility class for interacting with the Tugboat API.
 */
export class TugboatApiClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private debugMode: boolean;
  
  /**
   * Create a new Tugboat API client
   * 
   * @param apiKey The Tugboat API key to use for authentication
   * @param baseUrl The base URL for the Tugboat API (defaults to production API)
   * @param debug Enable debug mode for detailed logging (defaults to false)
   */
  constructor(private apiKey: string, baseUrl = 'https://api.tugboatqa.com/v3', debug = false) {
    this.baseUrl = baseUrl;
    this.debugMode = debug;
    
    this.client = axios.create({
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
  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Update the authorization headers for the API client
   * 
   * @param authHeaders New authorization headers
   */
  updateAuthHeaders(authHeaders: Record<string, string>): void {
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
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
  
  /**
   * Make a GET request to the Tugboat API
   * 
   * @param endpoint The API endpoint to request
   * @param config Optional Axios request configuration
   * @returns The API response data
   */
  async get(endpoint: string, config?: AxiosRequestConfig) {
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
        } catch (jsonError: unknown) {
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
    } catch (error) {
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
  async post(endpoint: string, data?: any, config?: AxiosRequestConfig) {
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
    } catch (error) {
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
  async patch(endpoint: string, data?: any, config?: AxiosRequestConfig) {
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
    } catch (error) {
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
  async delete(endpoint: string, config?: AxiosRequestConfig) {
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
    } catch (error) {
      if (this.debugMode) {
        console.error(`API DELETE error for ${endpoint}:`, error);
      }
      this.handleApiError(error);
    }
  }
  
  /**
   * Handle API errors by throwing an enhanced error with more context
   */
  private handleApiError(error: any) {
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
      } else if (statusCode === 403) {
        throw new Error('Tugboat API Error: Authorization failed. You do not have permission to perform this action.');
      } else if (statusCode === 404) {
        throw new Error(`Tugboat API Error: Resource not found at ${error.config?.url || 'unknown endpoint'}`);
      } else {
        throw new Error(`Tugboat API Error (${statusCode}): ${errorMessage}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      if (this.debugMode) {
        console.error('API request made but no response received:', error.request);
      }
      throw new Error('Tugboat API Error: No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      if (this.debugMode) {
        console.error('API request setup error:', error.message);
      }
      throw new Error(`Tugboat API Error: ${error.message}`);
    }
  }

  /**
   * Get repository details
   * 
   * @param repositoryId The ID of the repository
   * @returns Repository details
   */
  async getRepository(repositoryId: string) {
    return this.get(`/repositories/${repositoryId}`);
  }

  /**
   * Create a new repository
   * 
   * @param projectId The ID of the project to create the repository in
   * @param name The name of the repository
   * @param provider The git provider (github, gitlab, etc)
   * @param url The repository URL
   * @param isPrivate Whether the repository is private
   * @param buildSettings Optional build settings
   * @returns The created repository
   */
  async createRepository(
    projectId: string,
    name: string,
    provider: string,
    url: string,
    isPrivate?: boolean,
    buildSettings?: any
  ) {
    const data: any = {
      name,
      provider,
      url
    };
    
    if (isPrivate !== undefined) {
      data.private = isPrivate;
    }
    
    if (buildSettings) {
      data.buildSettings = buildSettings;
    }
    
    return this.post(`/projects/${projectId}/repositories`, data);
  }

  /**
   * Update repository details
   * 
   * @param repositoryId The ID of the repository
   * @param data The repository data to update
   * @returns The updated repository
   */
  async updateRepository(repositoryId: string, data: any) {
    return this.patch(`/repositories/${repositoryId}`, data);
  }

  /**
   * Delete a repository
   * 
   * @param repositoryId The ID of the repository
   * @returns Success status
   */
  async deleteRepository(repositoryId: string) {
    return this.delete(`/repositories/${repositoryId}`);
  }

  /**
   * Get repository previews
   * 
   * @param repositoryId The ID of the repository
   * @returns List of repository previews
   */
  async getRepositoryPreviews(repositoryId: string) {
    return this.get(`/repositories/${repositoryId}/previews`);
  }

  /**
   * Get repository branches
   * 
   * @param repositoryId The ID of the repository
   * @returns List of repository branches
   */
  async getRepositoryBranches(repositoryId: string) {
    return this.get(`/repositories/${repositoryId}/branches`);
  }

  /**
   * Get repository pull requests
   * 
   * @param repositoryId The ID of the repository
   * @returns List of repository pull requests
   */
  async getRepositoryPullRequests(repositoryId: string) {
    return this.get(`/repositories/${repositoryId}/pull-requests`);
  }

  /**
   * Search for previews
   * 
   * @param params The search parameters (query, state)
   * @returns A promise resolving to the search results
   */
  public async searchPreviews(params: { query: string, state?: string, limit?: number, offset?: number }): Promise<any> {
    if (this.debugMode) {
      console.log(`[Tugboat API] Searching previews with params: ${JSON.stringify(params)}`);
    }
    
    try {
      const response = await this.client.get('/previews', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Search for projects
   * 
   * @param params The search parameters (query, limit, offset)
   * @returns A promise resolving to the search results
   */
  public async searchProjects(params: { query: string, limit?: number, offset?: number }): Promise<any> {
    if (this.debugMode) {
      console.log(`[Tugboat API] Searching projects with params: ${JSON.stringify(params)}`);
    }
    
    try {
      const response = await this.client.get('/projects', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Search for repositories
   * 
   * @param params The search parameters (query, projectId, limit, offset)
   * @returns A promise resolving to the search results
   */
  public async searchRepositories(params: { query: string, projectId?: string, limit?: number, offset?: number }): Promise<any> {
    if (this.debugMode) {
      console.log(`[Tugboat API] Searching repositories with params: ${JSON.stringify(params)}`);
    }
    
    try {
      const response = await this.client.get('/repositories', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Create a new preview
   * 
   * @param repo Repository ID
   * @param ref Git reference (branch, tag, or commit)
   * @param name Optional preview name
   * @param config Optional preview configuration
   * @returns The created preview data
   */
  async createPreview(repo: string, ref: string, name?: string, config?: any): Promise<any> {
    const data = {
      ref,
      name,
      config
    };
    return this.post(`/previews/${repo}`, data);
  }

  /**
   * Build a preview
   * 
   * @param previewId ID of the preview to build
   * @returns The build result
   */
  async buildPreview(previewId: string): Promise<any> {
    return this.post(`/previews/${previewId}/build`);
  }

  /**
   * Refresh a preview
   * 
   * @param previewId ID of the preview to refresh
   * @returns The refresh result
   */
  async refreshPreview(previewId: string): Promise<any> {
    return this.post(`/previews/${previewId}/refresh`);
  }

  /**
   * Delete a preview
   * 
   * @param previewId ID of the preview to delete
   * @returns The deletion result
   */
  async deletePreview(previewId: string): Promise<any> {
    return this.post(`/previews/${previewId}/delete`);
  }

  /**
   * Get logs for a preview
   * 
   * @param previewId ID of the preview
   * @param lines Optional number of lines to return
   * @returns The preview logs
   */
  async getPreviewLogs(previewId: string, lines?: number): Promise<any> {
    const params = lines ? { lines } : undefined;
    return this.get(`/previews/${previewId}/logs`, { params });
  }
} 