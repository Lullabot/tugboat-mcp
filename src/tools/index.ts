import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TugboatApiClient } from "../utils/api-client";
import { getConfig } from "../utils/config";
import { AuthManager } from "../utils/auth";

// Logger interface
interface Logger {
  log: (message: string) => void;
  error: (message: string) => void;
}

/**
 * Format a size in bytes to a human-readable string
 */
function formatSize(bytes: number): string {
  if (bytes === undefined || bytes === null) return 'Unknown';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Register all tools with the MCP server
 */
export function registerTools(server: McpServer, logger?: Logger) {
  const config = getConfig();
  const apiClient = new TugboatApiClient(config.apiKey, config.baseUrl);
  const authManager = new AuthManager(apiClient);
  
  // Use console as fallback if no logger provided
  const log = logger || {
    log: console.log,
    error: console.error
  };
  
  // Register preview tools
  registerPreviewTools(server, apiClient, authManager, log);
  
  // Register search tools
  registerSearchTools(server, apiClient, authManager, log);
  
  // Register project tools
  registerProjectTools(server, apiClient, authManager, log);
  
  // Register repository tools
  registerRepositoryTools(server, apiClient, authManager, log);
}

/**
 * Register preview-related tools
 */
function registerPreviewTools(server: McpServer, apiClient: TugboatApiClient, authManager: AuthManager, logger: Logger) {
  // Create preview tool
  server.tool(
    "createPreview",
    {
      // Defining 'repo' instead of 'repoId' to match the API documentation terminology
      repo: z.string()
        .min(24, "Repository ID must be at least 24 characters")
        .max(24, "Repository ID must be at most 24 characters")
        .describe("Repository ID (24 characters) to create the preview in"),
      
      // The required git reference parameter
      ref: z.string()
        .min(1, "Git reference cannot be empty")
        .describe("Git reference to use for the preview (pull request number, branch, tag, or commit hash)"),
      
      // Optional name parameter with defaults
      name: z.string()
        .optional()
        .describe("Name for the preview (optional, defaults to the reference name)"),
      
      // Optional configuration parameter
      config: z.record(z.any())
        .optional()
        .describe("Optional preview configuration")
    },
    async ({ repo, ref, name, config }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`repository/${repo}`, 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to create previews in repository ${repo}`
              }
            ]
          };
        }
        
        // Validate that we have the required parameters
        if (!repo || !ref) {
          const missingParams = [];
          if (!repo) missingParams.push('repo');
          if (!ref) missingParams.push('ref');
          
          return {
            content: [
              {
                type: "text",
                text: `Error: Missing required parameters: ${missingParams.join(', ')}`
              }
            ]
          };
        }
        
        // Prepare the request data
        const data = {
          ref,
          ...(name ? { name } : {}),
          ...(config ? { config } : {})
        };
        
        logger.log(`Creating preview in repository ${repo} with ref ${ref}`);
        
        // Make the API request
        const preview = await apiClient.post(`/repos/${repo}/previews`, data);
        
        // Return success message with preview details
        return {
          content: [
            {
              type: "text",
              text: `Preview created successfully!\n\nID: ${preview.id}\nName: ${preview.name || 'Unnamed'}\nRepository: ${repo}\nReference: ${ref}`
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error creating preview: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error creating preview: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Build preview tool
  server.tool(
    "buildPreview",
    {
      previewId: z.string().describe("ID of the preview to build")
    },
    async ({ previewId }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`preview/${previewId}`, 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to build preview ${previewId}`
              }
            ]
          };
        }
        
        await apiClient.post(`/previews/${previewId}/build`);
        
        return {
          content: [
            {
              type: "text",
              text: `Preview ${previewId} build started successfully`
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error building preview ${previewId}: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error building preview: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Refresh preview tool
  server.tool(
    "refreshPreview",
    {
      previewId: z.string().describe("ID of the preview to refresh")
    },
    async ({ previewId }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`preview/${previewId}`, 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to refresh preview ${previewId}`
              }
            ]
          };
        }
        
        await apiClient.post(`/previews/${previewId}/refresh`);
        
        return {
          content: [
            {
              type: "text",
              text: `Preview ${previewId} refresh started successfully`
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error refreshing preview ${previewId}: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error refreshing preview: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Delete preview tool
  server.tool(
    "deletePreview",
    {
      previewId: z.string().describe("ID of the preview to delete")
    },
    async ({ previewId }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`preview/${previewId}`, 'delete');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to delete preview ${previewId}`
              }
            ]
          };
        }
        
        await apiClient.delete(`/previews/${previewId}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Preview ${previewId} deleted successfully`
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error deleting preview ${previewId}: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error deleting preview: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Get preview tool
  server.tool(
    "getPreview",
    {
      previewId: z.string().describe("ID of the preview to get information about")
    },
    async ({ previewId }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`preview/${previewId}`, 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to access preview ${previewId}`
              }
            ]
          };
        }
        
        logger.log(`Fetching information for preview ${previewId}`);
        const preview = await apiClient.get(`/previews/${previewId}`);
        
        // Format the output
        let resultText = `Preview Details for ID: ${previewId}\n\n`;
        
        // Generate a well-formatted preview summary
        resultText += `Name: ${preview.name || 'Unnamed'}\n`;
        resultText += `State: ${preview.state || 'Unknown'}\n`;
        
        if (preview.ref) resultText += `Reference: ${preview.ref}\n`;
        if (preview.url) resultText += `URL: ${preview.url}\n`;
        if (preview.createdAt) resultText += `Created: ${preview.createdAt}\n`;
        if (preview.size !== undefined) resultText += `Size: ${formatSize(preview.size)}\n`;
        if (preview.locked !== undefined) resultText += `Locked: ${preview.locked ? 'Yes' : 'No'}\n`;
        if (preview.anchor !== undefined) resultText += `Anchor: ${preview.anchor ? 'Yes' : 'No'}\n`;
        if (preview.expires) resultText += `Expires: ${preview.expires}\n`;
        
        // Show any additional information that might be useful
        if (preview.build_begin) resultText += `Build Started: ${preview.build_begin}\n`;
        if (preview.build_end) resultText += `Build Completed: ${preview.build_end}\n`;
        if (preview.repository) resultText += `Repository: ${preview.repository.name || preview.repository.id}\n`;
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error getting preview ${previewId}: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error getting preview information: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Update preview tool
  server.tool(
    "updatePreview",
    {
      previewId: z.string().describe("ID of the preview to update"),
      name: z.string().optional().describe("New name for the preview"),
      locked: z.boolean().optional().describe("Whether the preview is locked from deletion"),
      anchor: z.boolean().optional().describe("Whether the preview is used as a default Base Preview"),
      anchor_type: z.enum(['repo', 'branch']).optional().describe("When anchor is true, this defines how the preview is used as a default Base Preview"),
      config: z.record(z.any()).optional().describe("Preview configuration")
    },
    async ({ previewId, name, locked, anchor, anchor_type, config }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`preview/${previewId}`, 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to update preview ${previewId}`
              }
            ]
          };
        }
        
        // Construct update payload with only defined properties
        const updateData: Record<string, any> = {};
        if (name !== undefined) updateData.name = name;
        if (locked !== undefined) updateData.locked = locked;
        if (anchor !== undefined) updateData.anchor = anchor;
        if (anchor_type !== undefined) updateData.anchor_type = anchor_type;
        if (config !== undefined) updateData.config = config;
        
        if (Object.keys(updateData).length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `Error: No update parameters specified`
              }
            ]
          };
        }
        
        logger.log(`Updating preview ${previewId} with properties: ${Object.keys(updateData).join(', ')}`);
        const updatedPreview = await apiClient.patch(`/previews/${previewId}`, updateData);
        
        // Format the output to show what was updated
        let resultText = `Preview ${previewId} updated successfully\n\n`;
        resultText += `Updated properties: ${Object.keys(updateData).join(', ')}\n\n`;
        
        // Show the updated preview details
        resultText += `Current preview details:\n`;
        resultText += `Name: ${updatedPreview.name || 'Unnamed'}\n`;
        if (updatedPreview.locked !== undefined) resultText += `Locked: ${updatedPreview.locked ? 'Yes' : 'No'}\n`;
        if (updatedPreview.anchor !== undefined) resultText += `Anchor: ${updatedPreview.anchor ? 'Yes' : 'No'}\n`;
        if (updatedPreview.anchor_type) resultText += `Anchor Type: ${updatedPreview.anchor_type}\n`;
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error updating preview ${previewId}: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error updating preview: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Get preview jobs tool
  server.tool(
    "getPreviewJobs",
    {
      previewId: z.string().describe("ID of the preview to get jobs for"),
      active: z.boolean().optional().describe("Whether to only show active jobs")
    },
    async ({ previewId, active }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`preview/${previewId}`, 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to access jobs for preview ${previewId}`
              }
            ]
          };
        }
        
        // Construct query parameters if needed
        const queryParams = active !== undefined ? `?active=${active}` : '';
        
        logger.log(`Fetching jobs for preview ${previewId}`);
        const jobs = await apiClient.get(`/previews/${previewId}/jobs${queryParams}`);
        
        if (!Array.isArray(jobs)) {
          throw new Error("Unexpected response format from API");
        }
        
        // Format the output
        let resultText = `Jobs for Preview ${previewId}:\n\n`;
        
        if (jobs.length === 0) {
          resultText += "No jobs found for this preview.";
        } else {
          jobs.forEach((job, index) => {
            resultText += `${index + 1}. Job ID: ${job.id || 'Unknown'}\n`;
            if (job.status) resultText += `   Status: ${job.status}\n`;
            if (job.type) resultText += `   Type: ${job.type}\n`;
            if (job.result) resultText += `   Result: ${job.result}\n`;
            if (job.created) resultText += `   Created: ${job.created}\n`;
            if (job.updated) resultText += `   Updated: ${job.updated}\n`;
            resultText += '\n';
          });
        }
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error getting jobs for preview ${previewId}: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error getting jobs: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Get preview statistics tool
  server.tool(
    "getPreviewStatistics",
    {
      previewId: z.string().describe("ID of the preview to get statistics for"),
      item: z.enum(['build-time', 'refresh-time', 'size', 'services']).describe("The type of statistics to retrieve"),
      limit: z.number().optional().describe("Return this many of the most recent results"),
      before: z.string().optional().describe("Only return results that were gathered at or before this date/time"),
      after: z.string().optional().describe("Only return results that were gathered at or after this date/time")
    },
    async ({ previewId, item, limit, before, after }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`preview/${previewId}`, 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to access statistics for preview ${previewId}`
              }
            ]
          };
        }
        
        // Construct query parameters if needed
        const queryParams = new URLSearchParams();
        if (limit !== undefined) queryParams.append('limit', limit.toString());
        if (before !== undefined) queryParams.append('before', before);
        if (after !== undefined) queryParams.append('after', after);
        
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        
        logger.log(`Fetching ${item} statistics for preview ${previewId}`);
        const statistics = await apiClient.get(`/previews/${previewId}/statistics/${item}${queryString}`);
        
        if (!Array.isArray(statistics)) {
          throw new Error("Unexpected response format from API");
        }
        
        // Format the output
        let resultText = `${item.charAt(0).toUpperCase() + item.slice(1)} Statistics for Preview ${previewId}:\n\n`;
        
        if (statistics.length === 0) {
          resultText += "No statistics found for this preview.";
        } else {
          statistics.forEach((stat, index) => {
            resultText += `${index + 1}. Date: ${stat.date || 'Unknown'}\n`;
            if (stat.value !== undefined) {
              // Format the value based on statistic type
              if (item === 'size') {
                resultText += `   Value: ${formatSize(stat.value)}\n`;
              } else if (item.includes('time')) {
                resultText += `   Value: ${stat.value} seconds\n`;
              } else {
                resultText += `   Value: ${stat.value}\n`;
              }
            }
            resultText += '\n';
          });
        }
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error getting statistics for preview ${previewId}: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error getting statistics: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Clone preview tool
  server.tool(
    "clonePreview",
    {
      previewId: z.string().describe("ID of the preview to clone"),
      name: z.string().optional().describe("Name for the cloned preview"),
      expires: z.string().optional().describe("If set, the cloned preview will automatically be deleted at this time (ISO date format)")
    },
    async ({ previewId, name, expires }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`preview/${previewId}`, 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to clone preview ${previewId}`
              }
            ]
          };
        }
        
        // Prepare request data
        const data: Record<string, any> = {};
        if (name !== undefined) data.name = name;
        if (expires !== undefined) data.expires = expires;
        
        logger.log(`Cloning preview ${previewId}`);
        const job = await apiClient.post(`/previews/${previewId}/clone`, data);
        
        // Format the output
        let resultText = `Clone operation started for preview ${previewId}\n\n`;
        
        if (job.id) resultText += `Job ID: ${job.id}\n`;
        if (job.status) resultText += `Status: ${job.status}\n`;
        if (job.type) resultText += `Type: ${job.type}\n`;
        
        if (name) resultText += `\nThe cloned preview will be named: ${name}\n`;
        if (expires) resultText += `The cloned preview will expire at: ${expires}\n`;
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error cloning preview ${previewId}: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error cloning preview: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Start preview tool
  server.tool(
    "startPreview",
    {
      previewId: z.string().describe("ID of the preview to start")
    },
    async ({ previewId }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`preview/${previewId}`, 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to start preview ${previewId}`
              }
            ]
          };
        }
        
        logger.log(`Starting preview ${previewId}`);
        const job = await apiClient.post(`/previews/${previewId}/start`);
        
        return {
          content: [
            {
              type: "text",
              text: `Preview ${previewId} start operation initiated\n\nJob ID: ${job.id || 'Unknown'}\nStatus: ${job.status || 'Unknown'}`
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error starting preview ${previewId}: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error starting preview: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Stop preview tool
  server.tool(
    "stopPreview",
    {
      previewId: z.string().describe("ID of the preview to stop")
    },
    async ({ previewId }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`preview/${previewId}`, 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to stop preview ${previewId}`
              }
            ]
          };
        }
        
        logger.log(`Stopping preview ${previewId}`);
        const job = await apiClient.post(`/previews/${previewId}/stop`);
        
        return {
          content: [
            {
              type: "text",
              text: `Preview ${previewId} stop operation initiated\n\nJob ID: ${job.id || 'Unknown'}\nStatus: ${job.status || 'Unknown'}`
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error stopping preview ${previewId}: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error stopping preview: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Suspend preview tool
  server.tool(
    "suspendPreview",
    {
      previewId: z.string().describe("ID of the preview to suspend")
    },
    async ({ previewId }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`preview/${previewId}`, 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to suspend preview ${previewId}`
              }
            ]
          };
        }
        
        logger.log(`Suspending preview ${previewId}`);
        const job = await apiClient.post(`/previews/${previewId}/suspend`);
        
        return {
          content: [
            {
              type: "text",
              text: `Preview ${previewId} suspend operation initiated\n\nJob ID: ${job.id || 'Unknown'}\nStatus: ${job.status || 'Unknown'}`
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error suspending preview ${previewId}: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error suspending preview: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
}

/**
 * Register search-related tools
 */
function registerSearchTools(server: McpServer, apiClient: TugboatApiClient, authManager: AuthManager, logger: Logger) {
  // Search previews tool
  server.tool(
    "searchPreviews",
    {
      query: z.string().describe("Search terms to filter previews by name or other properties"),
      state: z.enum(['all', 'ready', 'building', 'failed']).optional().describe("Filter by preview state")
    },
    async ({ query, state }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('previews', 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to search previews`
              }
            ]
          };
        }
        
        logger.log(`Fetching all previews to search for "${query}"`);
        
        // First try direct previews endpoint
        try {
          // Get all previews - the API doesn't support direct searching
          const allPreviews = await apiClient.get('/previews');
          
          if (!Array.isArray(allPreviews)) {
            throw new Error("Unexpected response format from API");
          }
          
          // Filter the previews client-side
          const matchingPreviews = allPreviews.filter(preview => {
            // If state filter is provided, check preview state
            if (state && preview.state !== state && !(state === 'all')) {
              return false;
            }
            
            // Convert query to lowercase for case-insensitive search
            const queryLower = query.toLowerCase();
            
            // Search in various fields
            return (
              // Search in name
              (preview.name && preview.name.toLowerCase().includes(queryLower)) ||
              // Search in ID
              (preview.id && preview.id.toLowerCase().includes(queryLower)) ||
              // Search in ref
              (preview.ref && preview.ref.toLowerCase().includes(queryLower)) ||
              // Search in other relevant fields...
              (preview.url && preview.url.toLowerCase().includes(queryLower))
            );
          });
          
          logger.log(`Found ${matchingPreviews.length} previews matching "${query}" out of ${allPreviews.length} total`);
          
          // Format the output
          let resultText = `Found ${matchingPreviews.length} previews matching "${query}":\n\n`;
          
          if (matchingPreviews.length === 0) {
            resultText += "No matching previews found.";
          } else {
            // Format each preview for better readability
            matchingPreviews.forEach((preview, index) => {
              resultText += `${index + 1}. ${preview.name || 'Unnamed'} (ID: ${preview.id})\n`;
              resultText += `   State: ${preview.state || 'Unknown'}\n`;
              if (preview.url) resultText += `   URL: ${preview.url}\n`;
              if (preview.created) resultText += `   Created: ${new Date(preview.created).toLocaleString()}\n`;
              resultText += '\n';
            });
          }
          
          return {
            content: [
              {
                type: "text",
                text: resultText
              }
            ]
          };
        } catch (error: any) {
          logger.error(`Error with direct previews endpoint: ${error.message || 'Unknown error'}`);
          
          // If the direct approach fails, try getting previews from projects
          logger.log("Attempting to fetch previews through projects instead");
          const projects = await apiClient.get('/projects');
          
          if (!Array.isArray(projects)) {
            throw new Error("Unexpected response format from projects API");
          }
          
          // Collect all previews from all projects
          const allPreviews = [];
          
          for (const project of projects) {
            try {
              if (project.id) {
                logger.log(`Fetching previews for project ${project.id}`);
                const projectPreviews = await apiClient.get(`/repos/${project.id}/previews`);
                
                if (Array.isArray(projectPreviews)) {
                  allPreviews.push(...projectPreviews);
                }
              }
            } catch (projectError: any) {
              logger.error(`Error fetching previews for project ${project.id}: ${projectError.message || 'Unknown error'}`);
              // Continue to the next project
            }
          }
          
          // Filter the collected previews client-side
          const matchingPreviews = allPreviews.filter(preview => {
            // If state filter is provided, check preview state
            if (state && preview.state !== state && !(state === 'all')) {
              return false;
            }
            
            // Convert query to lowercase for case-insensitive search
            const queryLower = query.toLowerCase();
            
            // Search in various fields
            return (
              // Search in name
              (preview.name && preview.name.toLowerCase().includes(queryLower)) ||
              // Search in ID
              (preview.id && preview.id.toLowerCase().includes(queryLower)) ||
              // Search in ref
              (preview.ref && preview.ref.toLowerCase().includes(queryLower)) ||
              // Search in other relevant fields...
              (preview.url && preview.url.toLowerCase().includes(queryLower))
            );
          });
          
          logger.log(`Found ${matchingPreviews.length} previews matching "${query}" out of ${allPreviews.length} total (from projects)`);
          
          // Format the output
          let resultText = `Found ${matchingPreviews.length} previews matching "${query}":\n\n`;
          
          if (matchingPreviews.length === 0) {
            resultText += "No matching previews found.";
          } else {
            // Format each preview for better readability
            matchingPreviews.forEach((preview, index) => {
              resultText += `${index + 1}. ${preview.name || 'Unnamed'} (ID: ${preview.id})\n`;
              resultText += `   State: ${preview.state || 'Unknown'}\n`;
              if (preview.url) resultText += `   URL: ${preview.url}\n`;
              if (preview.created) resultText += `   Created: ${new Date(preview.created).toLocaleString()}\n`;
              resultText += '\n';
            });
          }
          
          return {
            content: [
              {
                type: "text",
                text: resultText
              }
            ]
          };
        }
      } catch (error: any) {
        logger.error(`Error searching previews: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error searching previews: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Search projects tool
  server.tool(
    "searchProjects",
    {
      query: z.string().describe("Search terms to filter projects by name or other properties")
    },
    async ({ query }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('projects', 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to search projects`
              }
            ]
          };
        }
        
        logger.log(`Fetching all projects to search for "${query}"`);
        
        // Get all projects - the API doesn't support direct searching
        const allProjects = await apiClient.get('/projects');
        
        if (!Array.isArray(allProjects)) {
          throw new Error("Unexpected response format from API");
        }
        
        // Filter the projects client-side
        const matchingProjects = allProjects.filter(project => {
          // Convert query to lowercase for case-insensitive search
          const queryLower = query.toLowerCase();
          
          // Search in various fields
          return (
            // Search in name
            (project.name && project.name.toLowerCase().includes(queryLower)) ||
            // Search in ID
            (project.id && project.id.toLowerCase().includes(queryLower)) ||
            // Search in description
            (project.description && project.description.toLowerCase().includes(queryLower))
          );
        });
        
        logger.log(`Found ${matchingProjects.length} projects matching "${query}" out of ${allProjects.length} total`);
        
        // Format the output
        let resultText = `Found ${matchingProjects.length} projects matching "${query}":\n\n`;
        
        if (matchingProjects.length === 0) {
          resultText += "No matching projects found.";
        } else {
          // Format each project for better readability
          matchingProjects.forEach((project, index) => {
            resultText += `${index + 1}. ${project.name || 'Unnamed'} (ID: ${project.id})\n`;
            if (project.description) resultText += `   Description: ${project.description}\n`;
            resultText += '\n';
          });
        }
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error searching projects: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error searching projects: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
}

/**
 * Register project-related tools
 */
function registerProjectTools(server: McpServer, apiClient: TugboatApiClient, authManager: AuthManager, logger: Logger) {
  // List projects tool
  server.tool(
    "listProjects",
    "List all projects that the authenticated user has access to",
    async (extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('projects', 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to list projects`
              }
            ]
          };
        }
        
        logger.log('Fetching all projects');
        
        // Get all projects
        const projects = await apiClient.get('/projects');
        
        if (!Array.isArray(projects)) {
          throw new Error("Unexpected response format from API");
        }
        
        if (projects.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No projects found."
              }
            ]
          };
        }
        
        // Format the projects as text
        let resultText = `Found ${projects.length} projects:\n\n`;
        
        projects.forEach((project, index) => {
          resultText += `${index + 1}. ${project.name || 'Unnamed'} (ID: ${project.id})\n`;
          resultText += `   Created: ${project.createdAt}\n`;
          resultText += `   Updated: ${project.updatedAt}\n`;
          resultText += `   Size: ${formatSize(project.size)}\n`;
          resultText += `   Quota: ${project.quota} GB\n`;
          resultText += `   Repos: ${project.repos ? project.repos.length : 0}\n\n`;
        });
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error listing projects: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error listing projects: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Get project tool
  server.tool(
    "getProject",
    {
      id: z.string()
        .min(24, "Project ID must be at least 24 characters")
        .max(24, "Project ID must be at most 24 characters")
        .describe("Project ID (24 characters)")
    },
    async ({ id }: { id: string }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('projects', 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to view project details`
              }
            ]
          };
        }
        
        logger.log(`Fetching project with ID: ${id}`);
        
        // Get project
        const project = await apiClient.get(`/projects/${id}`);
        
        // Format project details as text
        let resultText = `Project details:\n\n`;
        resultText += `ID: ${project.id}\n`;
        resultText += `Name: ${project.name || 'Unnamed'}\n`;
        resultText += `Created: ${project.createdAt}\n`;
        resultText += `Updated: ${project.updatedAt}\n`;
        resultText += `Size: ${formatSize(project.size)}\n`;
        resultText += `Quota: ${project.quota} GB\n`;
        resultText += `Memory: ${project.memory} MB\n`;
        resultText += `Build Memory: ${project.build_memory} MB\n`;
        resultText += `CPUs: ${project.cpus}\n`;
        resultText += `Sleep: ${project.sleep} minutes\n`;
        resultText += `Base Previews: ${project.base ? 'Allowed' : 'Not Allowed'}\n`;
        resultText += `Domain: ${project.domain || 'Default'}\n`;
        resultText += `Repos: ${project.repos ? project.repos.length : 0}\n`;
        resultText += `Admins: ${project.admins ? project.admins.join(', ') : 'None'}\n`;
        resultText += `Users: ${project.users ? project.users.join(', ') : 'None'}\n`;
        resultText += `Guests: ${project.guests ? project.guests.join(', ') : 'None'}\n`;
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error getting project: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error getting project: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Update project tool
  server.tool(
    "updateProject",
    {
      id: z.string()
        .min(24, "Project ID must be at least 24 characters")
        .max(24, "Project ID must be at most 24 characters")
        .describe("Project ID (24 characters)"),
      name: z.string().optional().describe("New project name"),
      domain: z.string().optional().describe("Default domain for Preview links")
    },
    async ({ id, name, domain }: { id: string; name?: string; domain?: string }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('projects', 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to update projects`
              }
            ]
          };
        }
        
        logger.log(`Updating project with ID: ${id}`);
        
        // Prepare update payload
        const updateData: Record<string, any> = {};
        if (name !== undefined) updateData.name = name;
        if (domain !== undefined) updateData.domain = domain;
        
        // Update project
        const updatedProject = await apiClient.patch(`/projects/${id}`, updateData);
        
        // Format updated project details as text
        let resultText = `Project updated successfully:\n\n`;
        resultText += `ID: ${updatedProject.id}\n`;
        resultText += `Name: ${updatedProject.name || 'Unnamed'}\n`;
        resultText += `Domain: ${updatedProject.domain || 'Default'}\n`;
        resultText += `Updated: ${updatedProject.updatedAt}\n`;
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error updating project: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error updating project: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Delete project tool
  server.tool(
    "deleteProject",
    {
      id: z.string()
        .min(24, "Project ID must be at least 24 characters")
        .max(24, "Project ID must be at most 24 characters")
        .describe("Project ID (24 characters)"),
      confirm: z.boolean().describe("Confirmation to delete the project")
    },
    async ({ id, confirm }: { id: string; confirm: boolean }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('projects', 'delete');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to delete projects`
              }
            ]
          };
        }
        
        // Safety check
        if (!confirm) {
          return {
            content: [
              {
                type: "text",
                text: `Operation cancelled. Set confirm=true to confirm deletion.`
              }
            ]
          };
        }
        
        logger.log(`Deleting project with ID: ${id}`);
        
        // Delete project
        await apiClient.delete(`/projects/${id}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Project with ID ${id} has been deleted successfully.`
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error deleting project: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error deleting project: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Get project repositories tool
  server.tool(
    "getProjectRepos",
    {
      id: z.string()
        .min(24, "Project ID must be at least 24 characters")
        .max(24, "Project ID must be at most 24 characters")
        .describe("Project ID (24 characters)")
    },
    async ({ id }: { id: string }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('projects', 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to view project repositories`
              }
            ]
          };
        }
        
        logger.log(`Fetching repositories for project: ${id}`);
        
        // Get project repositories
        const repos = await apiClient.get(`/projects/${id}/repos`);
        
        if (!Array.isArray(repos)) {
          throw new Error("Unexpected response format from API");
        }
        
        if (repos.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No repositories found for project ${id}.`
              }
            ]
          };
        }
        
        // Format the repositories as text
        let resultText = `Found ${repos.length} repositories for project ${id}:\n\n`;
        
        repos.forEach((repo, index) => {
          resultText += `${index + 1}. ${repo.name || 'Unnamed'} (ID: ${repo.id})\n`;
          resultText += `   Provider: ${repo.provider}\n`;
          resultText += `   Git: ${repo.git}\n`;
          resultText += `   Link: ${repo.link}\n`;
          resultText += `   Created: ${repo.createdAt}\n`;
          resultText += `   Updated: ${repo.updatedAt}\n\n`;
        });
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error getting project repositories: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error getting project repositories: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Get project jobs tool
  server.tool(
    "getProjectJobs",
    {
      id: z.string()
        .min(24, "Project ID must be at least 24 characters")
        .max(24, "Project ID must be at most 24 characters")
        .describe("Project ID (24 characters)"),
      children: z.boolean().optional().describe("Include jobs for repos, previews, and services"),
      limit: z.number().optional().describe("Number of jobs to return")
    },
    async ({ id, children, limit }: { id: string; children?: boolean; limit?: number }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('projects', 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to view project jobs`
              }
            ]
          };
        }
        
        logger.log(`Fetching jobs for project: ${id}`);
        
        // Build query parameters
        const queryParams: string[] = [];
        if (children !== undefined) queryParams.push(`children=${children}`);
        if (limit !== undefined) queryParams.push(`limit=${limit}`);
        
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
        
        // Get project jobs
        const jobs = await apiClient.get(`/projects/${id}/jobs${queryString}`);
        
        if (!Array.isArray(jobs)) {
          throw new Error("Unexpected response format from API");
        }
        
        if (jobs.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No jobs found for project ${id}.`
              }
            ]
          };
        }
        
        // Format the response
        let resultText = `Found ${jobs.length} jobs for project ${id}:\n\n`;
        
        jobs.forEach((job, index) => {
          resultText += `${index + 1}. Job ID: ${job.id}\n`;
          resultText += `   Action: ${job.action}\n`;
          resultText += `   Target: ${job.target}\n`;
          resultText += `   Result: ${job.result}\n`;
          resultText += `   Message: ${job.message}\n`;
          resultText += `   Created: ${job.createdAt}\n`;
          resultText += `   Started: ${job.startedAt}\n`;
          resultText += `   Ended: ${job.endedAt}\n\n`;
        });
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error getting project jobs: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error getting project jobs: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Get project statistics tool
  server.tool(
    "getProjectStats",
    {
      id: z.string()
        .min(24, "Project ID must be at least 24 characters")
        .max(24, "Project ID must be at most 24 characters")
        .describe("Project ID (24 characters)"),
      item: z.enum(['build-time', 'refresh-time', 'size', 'repos', 'previews', 'services'])
        .describe("Type of statistics to retrieve"),
      after: z.string().optional().describe("Only return results after this date/time"),
      before: z.string().optional().describe("Only return results before this date/time"),
      limit: z.number().optional().describe("Number of data points to return")
    },
    async ({ id, item, after, before, limit }: { 
      id: string; 
      item: 'build-time' | 'refresh-time' | 'size' | 'repos' | 'previews' | 'services'; 
      after?: string; 
      before?: string; 
      limit?: number 
    }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('projects', 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to view project statistics`
              }
            ]
          };
        }
        
        logger.log(`Fetching ${item} statistics for project: ${id}`);
        
        // Build query parameters
        const queryParams: string[] = [];
        if (after !== undefined) queryParams.push(`after=${after}`);
        if (before !== undefined) queryParams.push(`before=${before}`);
        if (limit !== undefined) queryParams.push(`limit=${limit}`);
        
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
        
        // Get project statistics
        const stats = await apiClient.get(`/projects/${id}/statistics/${item}${queryString}`);
        
        if (!Array.isArray(stats)) {
          throw new Error("Unexpected response format from API");
        }
        
        if (stats.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No ${item} statistics found for project ${id}.`
              }
            ]
          };
        }
        
        // Format the statistics as text
        let resultText = `${stats.length} ${item} data points for project ${id}:\n\n`;
        
        stats.forEach((stat, index) => {
          resultText += `${index + 1}. Timestamp: ${stat.timestamp}\n`;
          resultText += `   Value: ${stat.value}\n`;
          if (stat.preview) resultText += `   Preview: ${stat.preview}\n`;
          if (stat.repo) resultText += `   Repo: ${stat.repo}\n`;
          if (stat.service) resultText += `   Service: ${stat.service}\n`;
          resultText += '\n';
        });
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error getting project statistics: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error getting project statistics: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
}

/**
 * Register repository-related tools
 */
function registerRepositoryTools(server: McpServer, apiClient: TugboatApiClient, authManager: AuthManager, logger: Logger) {
  // Create repository tool
  server.tool(
    "createRepository",
    {
      project: z.string()
        .min(24, "Project ID must be at least 24 characters")
        .max(24, "Project ID must be at most 24 characters")
        .describe("Project ID the new repository belongs to"),
      provider: z.object({
        name: z.enum(["bitbucket", "git", "github", "gitlab", "stash"])
          .describe("Git provider name")
      }).describe("Information about the provider hosting the repository"),
      repository: z.object({
        group: z.string().describe("Repository owner, organization or group"),
        name: z.string().describe("Repository name")
      }).describe("Information about the provider repository"),
      auth: z.object({
        token: z.string().optional().describe("Personal access token"),
        access: z.string().optional().describe("OAuth access token"),
        user: z.string().optional().describe("Username"),
        pass: z.string().optional().describe("Password")
      }).optional().describe("Provider authentication information"),
      name: z.string().optional().describe("Human-readable label for the Repository"),
      autobuild: z.boolean().optional().describe("Whether to automatically create a Preview when a pull request is created"),
      autobuild_drafts: z.boolean().optional().describe("Whether to automatically create or update draft pull requests"),
      autodelete: z.boolean().optional().describe("Whether to automatically delete a Preview when its pull request is merged or closed"),
      autorebuild: z.boolean().optional().describe("Whether to automatically rebuild a Preview when code is pushed"),
      autoredeploy: z.boolean().optional().describe("When new code is pushed, deploy the new code without losing non-code changes"),
      domain: z.string().optional().describe("Default domain for Preview links"),
      provider_comment: z.boolean().optional().describe("Whether to add a comment to the pull request after build/rebuild/refresh"),
      provider_deployment: z.boolean().optional().describe("Whether to update the provider's deployment API"),
      provider_forks: z.boolean().optional().describe("Whether Previews are allowed from forked repositories"),
      provider_status: z.boolean().optional().describe("Whether to update the provider's status API"),
      build_timeout: z.number().min(1).max(18000).optional().describe("How long to let a Preview build run before timeout (seconds)")
    },
    async ({ project, provider, repository, auth, name, ...options }: { 
      project: string;
      provider: { name: "bitbucket" | "git" | "github" | "gitlab" | "stash" };
      repository: { group: string; name: string };
      auth?: { token?: string; access?: string; user?: string; pass?: string };
      name?: string;
      [key: string]: any;
    }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('repos', 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to create repositories`
              }
            ]
          };
        }
        
        logger.log(`Creating repository ${repository.group}/${repository.name} with provider ${provider.name} in project ${project}`);
        
        // Prepare the request payload
        const payload = {
          project,
          provider,
          repository,
          auth,
          name: name || `${repository.group}/${repository.name}`,
          ...options
        };
        
        // Create repository
        const newRepo = await apiClient.post('/repos', payload);
        
        // Format the response
        let resultText = `Repository created successfully:\n\n`;
        resultText += `ID: ${newRepo.id}\n`;
        resultText += `Name: ${newRepo.name}\n`;
        resultText += `Provider: ${newRepo.provider}\n`;
        resultText += `Git URL: ${newRepo.git}\n`;
        resultText += `Link: ${newRepo.link}\n`;
        resultText += `Webhook URL: ${newRepo.webhook}\n\n`;
        resultText += `Deploy Key:\n${newRepo.deploy_public}\n\n`;
        resultText += `SSH Public Key:\n${newRepo.ssh_public}\n`;
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error creating repository: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error creating repository: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  // Get repository tool
  server.tool(
    "getRepository",
    {
      id: z.string()
        .min(24, "Repository ID must be at least 24 characters")
        .max(24, "Repository ID must be at most 24 characters")
        .describe("Repository ID")
    },
    async ({ id }: { id: string }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('repos', 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to view repository details`
              }
            ]
          };
        }
        
        logger.log(`Fetching repository with ID: ${id}`);
        
        // Get repository
        const repo = await apiClient.get(`/repos/${id}`);
        
        // Format repository details as text
        let resultText = `Repository details:\n\n`;
        resultText += `ID: ${repo.id}\n`;
        resultText += `Name: ${repo.name || 'Unnamed'}\n`;
        resultText += `Provider: ${repo.provider}\n`;
        resultText += `Project: ${repo.project}\n`;
        resultText += `Git URL: ${repo.git}\n`;
        resultText += `Link: ${repo.link}\n`;
        resultText += `Created: ${repo.createdAt}\n`;
        resultText += `Updated: ${repo.updatedAt}\n`;
        resultText += `Size: ${formatSize(repo.size)}\n`;
        resultText += `Webhooks: ${repo.webhook}\n`;
        resultText += `Previews: ${repo.previews ? repo.previews.length : 0}\n`;
        resultText += `Domain: ${repo.domain || 'Default'}\n`;
        resultText += `Autobuild: ${repo.autobuild ? 'Enabled' : 'Disabled'}\n`;
        resultText += `Autobuild Drafts: ${repo.autobuild_drafts ? 'Enabled' : 'Disabled'}\n`;
        resultText += `Autodelete: ${repo.autodelete ? 'Enabled' : 'Disabled'}\n`;
        resultText += `Autorebuild: ${repo.autorebuild ? 'Enabled' : 'Disabled'}\n`;
        resultText += `Autoredeploy: ${repo.autoredeploy ? 'Enabled' : 'Disabled'}\n`;
        
        if (repo.envvars && repo.envvars.length > 0) {
          resultText += `\nEnvironment Variables:\n`;
          repo.envvars.forEach((envvar: string) => {
            resultText += `- ${envvar}\n`;
          });
        }
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error getting repository: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error getting repository: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Update repository tool
  server.tool(
    "updateRepository",
    {
      id: z.string()
        .min(24, "Repository ID must be at least 24 characters")
        .max(24, "Repository ID must be at most 24 characters")
        .describe("Repository ID"),
      name: z.string().optional().describe("Human-readable label for the Repository"),
      domain: z.string().optional().describe("Default domain for Preview links"),
      autobuild: z.boolean().optional().describe("Whether to automatically create a Preview when a pull request is created"),
      autobuild_drafts: z.boolean().optional().describe("Whether to automatically create or update draft pull requests"),
      autodelete: z.boolean().optional().describe("Whether to automatically delete a Preview when its pull request is merged or closed"),
      autorebuild: z.boolean().optional().describe("Whether to automatically rebuild a Preview when code is pushed"),
      autoredeploy: z.boolean().optional().describe("When new code is pushed, deploy the new code without losing non-code changes"),
      provider_comment: z.boolean().optional().describe("Whether to add a comment to the pull request after build/rebuild/refresh"),
      provider_deployment: z.boolean().optional().describe("Whether to update the provider's deployment API"),
      provider_forks: z.boolean().optional().describe("Whether Previews are allowed from forked repositories"),
      provider_status: z.boolean().optional().describe("Whether to update the provider's status API"),
      build_timeout: z.number().min(1).max(18000).optional().describe("How long to let a Preview build run before timeout (seconds)")
    },
    async ({ id, ...updateData }: { id: string; [key: string]: any }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('repos', 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to update repositories`
              }
            ]
          };
        }
        
        // Verify that at least one field is being updated
        const updateFields = Object.keys(updateData).filter(key => updateData[key] !== undefined);
        if (updateFields.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `Error: No fields to update were provided`
              }
            ]
          };
        }
        
        logger.log(`Updating repository ${id} with fields: ${updateFields.join(', ')}`);
        
        // Update repository
        const updatedRepo = await apiClient.patch(`/repos/${id}`, updateData);
        
        // Format the response
        let resultText = `Repository updated successfully:\n\n`;
        resultText += `ID: ${updatedRepo.id}\n`;
        resultText += `Name: ${updatedRepo.name}\n`;
        resultText += `Updated fields: ${updateFields.join(', ')}\n`;
        resultText += `Last updated: ${updatedRepo.updatedAt}\n`;
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error updating repository: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error updating repository: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Delete repository tool
  server.tool(
    "deleteRepository",
    {
      id: z.string()
        .min(24, "Repository ID must be at least 24 characters")
        .max(24, "Repository ID must be at most 24 characters")
        .describe("Repository ID"),
      confirm: z.boolean().describe("Confirmation to delete the repository")
    },
    async ({ id, confirm }: { id: string; confirm: boolean }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('repos', 'delete');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to delete repositories`
              }
            ]
          };
        }
        
        // Safety check
        if (!confirm) {
          return {
            content: [
              {
                type: "text",
                text: `Operation cancelled. Set confirm=true to confirm deletion.`
              }
            ]
          };
        }
        
        logger.log(`Deleting repository with ID: ${id}`);
        
        // Delete repository
        await apiClient.delete(`/repos/${id}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Repository with ID ${id} has been deleted successfully.`
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error deleting repository: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error deleting repository: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Update repository authentication tool
  server.tool(
    "updateRepositoryAuth",
    {
      id: z.string()
        .min(24, "Repository ID must be at least 24 characters")
        .max(24, "Repository ID must be at most 24 characters")
        .describe("Repository ID"),
      auth: z.object({
        token: z.string().optional().describe("Personal access token"),
        access: z.string().optional().describe("OAuth access token"),
        user: z.string().optional().describe("Username"),
        pass: z.string().optional().describe("Password")
      }).describe("Provider authentication information")
    },
    async ({ id, auth }: { id: string; auth: { token?: string; access?: string; user?: string; pass?: string } }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('repos', 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to update repository authentication`
              }
            ]
          };
        }
        
        logger.log(`Updating authentication for repository ${id}`);
        
        // Update repository auth
        const updatedRepo = await apiClient.patch(`/repos/${id}/auth`, { auth });
        
        return {
          content: [
            {
              type: "text",
              text: `Authentication updated successfully for repository ${updatedRepo.name} (${updatedRepo.id}).`
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error updating repository authentication: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error updating repository authentication: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Get repository previews tool
  server.tool(
    "getRepositoryPreviews",
    {
      id: z.string()
        .min(24, "Repository ID must be at least 24 characters")
        .max(24, "Repository ID must be at most 24 characters")
        .describe("Repository ID")
    },
    async ({ id }: { id: string }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('repos', 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to view repository previews`
              }
            ]
          };
        }
        
        logger.log(`Fetching previews for repository ${id}`);
        
        try {
          // Get repository previews with explicit error handling
          const previews = await apiClient.get(`/repos/${id}/previews`);
          
          // Validate response is an array
          if (!Array.isArray(previews)) {
            logger.error(`API returned non-array response: ${JSON.stringify(previews).substring(0, 100)}...`);
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Received unexpected response format from API. Expected array of previews.`
                }
              ]
            };
          }
          
          if (previews.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `No previews found for repository ${id}.`
                }
              ]
            };
          }
          
          // Format the response with proper validation for each field
          let resultText = `Found ${previews.length} previews for repository ${id}:\n\n`;
          
          previews.forEach((preview, index) => {
            // Validate preview object
            if (!preview || typeof preview !== 'object') {
              resultText += `${index + 1}. [Invalid preview data]\n\n`;
              return;
            }
            
            // Safely access properties with fallbacks
            const previewId = typeof preview.id === 'string' ? preview.id : 'unknown';
            const previewName = typeof preview.name === 'string' ? preview.name : 'Unnamed';
            const previewState = typeof preview.state === 'string' ? preview.state : 'unknown';
            const previewRef = typeof preview.ref === 'string' ? preview.ref : 'unknown';
            const previewUrl = typeof preview.url === 'string' ? preview.url : 'unknown';
            const previewCreated = typeof preview.createdAt === 'string' ? preview.createdAt : 'unknown';
            
            resultText += `${index + 1}. ${previewName} (ID: ${previewId})\n`;
            resultText += `   State: ${previewState}\n`;
            resultText += `   Reference: ${previewRef}\n`;
            resultText += `   URL: ${previewUrl}\n`;
            resultText += `   Created: ${previewCreated}\n`;
            
            // Only add optional fields if they exist and are valid
            if (typeof preview.build_begin === 'string') {
              resultText += `   Build Started: ${preview.build_begin}\n`;
            }
            
            if (typeof preview.build_end === 'string') {
              resultText += `   Build Completed: ${preview.build_end}\n`;
            }
            
            // Safely handle size with validation
            if (typeof preview.size === 'number') {
              resultText += `   Size: ${formatSize(preview.size)}\n`;
            } else if (preview.size !== undefined) {
              resultText += `   Size: ${preview.size}\n`;
            }
            
            resultText += `\n`;
          });
          
          return {
            content: [
              {
                type: "text",
                text: resultText
              }
            ]
          };
        } catch (apiError: any) {
          // Handle specific API errors
          logger.error(`API error when fetching previews: ${apiError.message || 'Unknown API error'}`);
          
          // Check if this is a JSON parsing error
          if (apiError.message && apiError.message.includes('JSON')) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: There was a problem parsing the response from the Tugboat API. The response may contain malformed JSON. Please try again later or contact support if the issue persists.`
                }
              ]
            };
          }
          
          throw apiError; // Re-throw to be caught by outer catch
        }
      } catch (error: any) {
        logger.error(`Error getting repository previews: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error getting repository previews: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Get repository branches tool
  server.tool(
    "getRepositoryBranches",
    {
      id: z.string()
        .min(24, "Repository ID must be at least 24 characters")
        .max(24, "Repository ID must be at most 24 characters")
        .describe("Repository ID")
    },
    async ({ id }: { id: string }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('repos', 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to view repository branches`
              }
            ]
          };
        }
        
        logger.log(`Fetching branches for repository ${id}`);
        
        // Get repository branches
        const branches = await apiClient.get(`/repos/${id}/branches`);
        
        if (!Array.isArray(branches)) {
          throw new Error("Unexpected response format from API");
        }
        
        if (branches.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No branches found for repository ${id}.`
              }
            ]
          };
        }
        
        // Format the response
        let resultText = `Found ${branches.length} branches for repository ${id}:\n\n`;
        
        branches.forEach((branch, index) => {
          resultText += `${index + 1}. ${branch.name}\n`;
          resultText += `   Ref: ${branch.ref}\n`;
          resultText += `   URL: ${branch.url}\n\n`;
        });
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error getting repository branches: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error getting repository branches: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Get repository tags tool
  server.tool(
    "getRepositoryTags",
    {
      id: z.string()
        .min(24, "Repository ID must be at least 24 characters")
        .max(24, "Repository ID must be at most 24 characters")
        .describe("Repository ID")
    },
    async ({ id }: { id: string }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('repos', 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to view repository tags`
              }
            ]
          };
        }
        
        logger.log(`Fetching tags for repository ${id}`);
        
        // Get repository tags
        const tags = await apiClient.get(`/repos/${id}/tags`);
        
        if (!Array.isArray(tags)) {
          throw new Error("Unexpected response format from API");
        }
        
        if (tags.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No tags found for repository ${id}.`
              }
            ]
          };
        }
        
        // Format the response
        let resultText = `Found ${tags.length} tags for repository ${id}:\n\n`;
        
        tags.forEach((tag, index) => {
          resultText += `${index + 1}. ${tag.name}\n`;
          resultText += `   Ref: ${tag.ref}\n`;
          resultText += `   URL: ${tag.url}\n\n`;
        });
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error getting repository tags: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error getting repository tags: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Get repository pull requests tool
  server.tool(
    "getRepositoryPullRequests",
    {
      id: z.string()
        .min(24, "Repository ID must be at least 24 characters")
        .max(24, "Repository ID must be at most 24 characters")
        .describe("Repository ID")
    },
    async ({ id }: { id: string }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('repos', 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to view repository pull requests`
              }
            ]
          };
        }
        
        logger.log(`Fetching pull requests for repository ${id}`);
        
        // Get repository pull requests
        const pullRequests = await apiClient.get(`/repos/${id}/pulls`);
        
        if (!Array.isArray(pullRequests)) {
          throw new Error("Unexpected response format from API");
        }
        
        if (pullRequests.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No pull requests found for repository ${id}.`
              }
            ]
          };
        }
        
        // Format the response
        let resultText = `Found ${pullRequests.length} pull requests for repository ${id}:\n\n`;
        
        pullRequests.forEach((pr, index) => {
          resultText += `${index + 1}. #${pr.number}: ${pr.name}\n`;
          resultText += `   Created: ${pr.created}\n`;
          resultText += `   Updated: ${pr.updated}\n`;
          resultText += `   URL: ${pr.url}\n\n`;
        });
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error getting repository pull requests: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error getting repository pull requests: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Get repository jobs tool
  server.tool(
    "getRepositoryJobs",
    {
      id: z.string()
        .min(24, "Repository ID must be at least 24 characters")
        .max(24, "Repository ID must be at most 24 characters")
        .describe("Repository ID"),
      action: z.array(z.enum(["keygen", "update"])).optional().describe("Filter jobs by action"),
      children: z.boolean().optional().describe("Include jobs for previews and services"),
      limit: z.number().optional().describe("Number of jobs to return")
    },
    async ({ id, action, children, limit }: { id: string; action?: string[]; children?: boolean; limit?: number }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('repos', 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to view repository jobs`
              }
            ]
          };
        }
        
        logger.log(`Fetching jobs for repository ${id}`);
        
        // Build query parameters
        const queryParams: string[] = [];
        if (action) {
          action.forEach(a => queryParams.push(`action=${a}`));
        }
        if (children !== undefined) queryParams.push(`children=${children}`);
        if (limit !== undefined) queryParams.push(`limit=${limit}`);
        
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
        
        // Get repository jobs
        const jobs = await apiClient.get(`/repos/${id}/jobs${queryString}`);
        
        if (!Array.isArray(jobs)) {
          throw new Error("Unexpected response format from API");
        }
        
        if (jobs.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No jobs found for repository ${id}.`
              }
            ]
          };
        }
        
        // Format the response
        let resultText = `Found ${jobs.length} jobs for repository ${id}:\n\n`;
        
        jobs.forEach((job, index) => {
          resultText += `${index + 1}. Job ID: ${job.id}\n`;
          resultText += `   Action: ${job.action}\n`;
          resultText += `   Target: ${job.target}\n`;
          resultText += `   Result: ${job.result}\n`;
          resultText += `   Created: ${job.createdAt}\n`;
          if (job.startedAt) resultText += `   Started: ${job.startedAt}\n`;
          if (job.endedAt) resultText += `   Ended: ${job.endedAt}\n`;
          resultText += `   Message: ${job.message || 'No message'}\n\n`;
        });
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error getting repository jobs: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error getting repository jobs: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Get repository registries tool
  server.tool(
    "getRepositoryRegistries",
    {
      id: z.string()
        .min(24, "Repository ID must be at least 24 characters")
        .max(24, "Repository ID must be at most 24 characters")
        .describe("Repository ID")
    },
    async ({ id }: { id: string }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('repos', 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to view repository registries`
              }
            ]
          };
        }
        
        logger.log(`Fetching Docker registries for repository ${id}`);
        
        // Get repository registries
        const registries = await apiClient.get(`/repos/${id}/registries`);
        
        if (!Array.isArray(registries)) {
          throw new Error("Unexpected response format from API");
        }
        
        if (registries.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No Docker registries found for repository ${id}.`
              }
            ]
          };
        }
        
        // Format the response
        let resultText = `Found ${registries.length} Docker registries for repository ${id}:\n\n`;
        
        registries.forEach((registry, index) => {
          resultText += `${index + 1}. Registry ID: ${registry.id}\n`;
          resultText += `   Server: ${registry.serveraddress}\n`;
          resultText += `   Username: ${registry.username}\n`;
          resultText += `   Email: ${registry.email || 'Not specified'}\n`;
          resultText += `   Created: ${registry.createdAt}\n`;
          resultText += `   Updated: ${registry.updatedAt}\n\n`;
        });
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error getting repository registries: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error getting repository registries: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Get repository statistics tool
  server.tool(
    "getRepositoryStats",
    {
      id: z.string()
        .min(24, "Repository ID must be at least 24 characters")
        .max(24, "Repository ID must be at most 24 characters")
        .describe("Repository ID"),
      item: z.enum(['build-time', 'refresh-time', 'size', 'previews', 'services'])
        .describe("Type of statistics to retrieve"),
      after: z.string().optional().describe("Only return results after this date/time"),
      before: z.string().optional().describe("Only return results before this date/time"),
      limit: z.number().optional().describe("Number of data points to return")
    },
    async ({ id, item, after, before, limit }: { 
      id: string; 
      item: 'build-time' | 'refresh-time' | 'size' | 'previews' | 'services'; 
      after?: string; 
      before?: string; 
      limit?: number 
    }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('repos', 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to view repository statistics`
              }
            ]
          };
        }
        
        logger.log(`Fetching ${item} statistics for repository ${id}`);
        
        // Build query parameters
        const queryParams: string[] = [];
        if (after !== undefined) queryParams.push(`after=${after}`);
        if (before !== undefined) queryParams.push(`before=${before}`);
        if (limit !== undefined) queryParams.push(`limit=${limit}`);
        
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
        
        // Get repository statistics
        const stats = await apiClient.get(`/repos/${id}/statistics/${item}${queryString}`);
        
        if (!Array.isArray(stats)) {
          throw new Error("Unexpected response format from API");
        }
        
        if (stats.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No ${item} statistics found for repository ${id}.`
              }
            ]
          };
        }
        
        // Format the statistics as text
        let resultText = `${stats.length} ${item} data points for repository ${id}:\n\n`;
        
        stats.forEach((stat, index) => {
          resultText += `${index + 1}. Timestamp: ${stat.timestamp}\n`;
          resultText += `   Value: ${stat.value}\n`;
          if (stat.preview) resultText += `   Preview: ${stat.preview}\n`;
          if (stat.service) resultText += `   Service: ${stat.service}\n`;
          resultText += '\n';
        });
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error getting repository statistics: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error getting repository statistics: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Create new SSH Key for repository tool
  server.tool(
    "createRepositorySSHKey",
    {
      id: z.string()
        .min(24, "Repository ID must be at least 24 characters")
        .max(24, "Repository ID must be at most 24 characters")
        .describe("Repository ID"),
      type: z.enum(["rsa", "dsa", "ecdsa", "ed25519"]).optional().describe("SSH key type"),
      bits: z.number().optional().describe("SSH key bit length")
    },
    async ({ id, type, bits }: { id: string; type?: "rsa" | "dsa" | "ecdsa" | "ed25519"; bits?: number }, extra: any) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('repos', 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to generate repository SSH keys`
              }
            ]
          };
        }
        
        logger.log(`Generating new SSH key for repository ${id}`);
        
        // Prepare the request payload
        const payload: Record<string, any> = {};
        if (type !== undefined) payload.type = type;
        if (bits !== undefined) payload.bits = bits;
        
        // Generate SSH key
        const updatedRepo = await apiClient.post(`/repos/${id}/keygen`, payload);
        
        // Format the response
        let resultText = `SSH key generated successfully for repository ${updatedRepo.name}:\n\n`;
        resultText += `Deploy Key:\n${updatedRepo.deploy_public}\n\n`;
        resultText += `SSH Public Key:\n${updatedRepo.ssh_public}\n`;
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error generating SSH key: ${error.message || 'Unknown error'}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error generating SSH key: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
} 