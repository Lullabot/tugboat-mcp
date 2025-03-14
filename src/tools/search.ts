import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TugboatApiClient } from "../utils/api-client";
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
 * Register search-related tools
 */
export function registerSearchTools(server: McpServer, apiClient: TugboatApiClient, authManager: AuthManager, logger: Logger) {
  // Search previews tool
  server.tool(
    "searchPreviews",
    {
      query: z.string()
        .min(1, "Search query cannot be empty")
        .max(100, "Search query cannot exceed 100 characters")
        .describe("Search query to find matching previews"),
      
      limit: z.number()
        .int("Limit must be an integer")
        .min(1, "Limit must be at least 1")
        .max(100, "Limit cannot exceed 100")
        .default(10)
        .optional()
        .describe("Maximum number of previews to return (default: 10)"),
      
      projectId: z.string()
        .min(24, "Project ID must be at least 24 characters")
        .max(24, "Project ID must be at most 24 characters")
        .optional()
        .describe("Filter previews by project ID (optional)")
    },
    async ({ query, limit = 10, projectId }) => {
      try {
        // Build search parameters
        const searchParams: any = {
          query,
          limit
        };
        
        if (projectId) {
          // Check authorization for the specific project
          const isAuthorized = await authManager.isAuthorized(`project/${projectId}`, 'read');
          if (!isAuthorized) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: You do not have permission to search previews in project ${projectId}`
                }
              ]
            };
          }
          searchParams.project = projectId;
        }
        
        // Perform the search
        const result = await apiClient.searchPreviews(searchParams);
        
        if (!result || !result.previews) {
          return {
            content: [
              {
                type: "text",
                text: `No previews found matching "${query}".`
              }
            ]
          };
        }
        
        const previews = result.previews;
        
        if (previews.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No previews found matching "${query}".`
              }
            ]
          };
        }
        
        // Format the previews list
        const content = [
          {
            type: "text",
            text: `Found ${previews.length} preview${previews.length === 1 ? '' : 's'} matching "${query}":`
          }
        ];
        
        previews.forEach((preview, index) => {
          content.push({
            type: "text",
            text: `${index + 1}. ${preview.name} (ID: ${preview.id})`
          });
          
          if (preview.status) {
            content.push({
              type: "text",
              text: `   Status: ${preview.status}`
            });
          }
          
          if (preview.url) {
            content.push({
              type: "text",
              text: `   URL: ${preview.url}`
            });
          }
          
          if (preview.repository) {
            content.push({
              type: "text",
              text: `   Repository: ${preview.repository.name || 'Unknown'} (ID: ${preview.repository.id || 'Unknown'})`
            });
          }
          
          if (preview.project) {
            content.push({
              type: "text",
              text: `   Project: ${preview.project.name || 'Unknown'} (ID: ${preview.project.id || 'Unknown'})`
            });
          }
        });
        
        return { content };
      } catch (error) {
        logger.error(`Error searching previews: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error searching previews: ${error.message}`
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
      query: z.string()
        .min(1, "Search query cannot be empty")
        .max(100, "Search query cannot exceed 100 characters")
        .describe("Search query to find matching projects"),
      
      limit: z.number()
        .int("Limit must be an integer")
        .min(1, "Limit must be at least 1")
        .max(100, "Limit cannot exceed 100")
        .default(10)
        .optional()
        .describe("Maximum number of projects to return (default: 10)")
    },
    async ({ query, limit = 10 }) => {
      try {
        // Perform the search
        const result = await apiClient.searchProjects({ query, limit });
        
        if (!result || !result.projects) {
          return {
            content: [
              {
                type: "text",
                text: `No projects found matching "${query}".`
              }
            ]
          };
        }
        
        const projects = result.projects;
        
        if (projects.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No projects found matching "${query}".`
              }
            ]
          };
        }
        
        // Filter projects based on authorization
        const authorizedProjects = [];
        for (const project of projects) {
          const isAuthorized = await authManager.isAuthorized(`project/${project.id}`, 'read');
          if (isAuthorized) {
            authorizedProjects.push(project);
          }
        }
        
        if (authorizedProjects.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No projects found matching "${query}" that you have permission to view.`
              }
            ]
          };
        }
        
        // Format the projects list
        const content = [
          {
            type: "text",
            text: `Found ${authorizedProjects.length} project${authorizedProjects.length === 1 ? '' : 's'} matching "${query}":`
          }
        ];
        
        authorizedProjects.forEach((project, index) => {
          content.push({
            type: "text",
            text: `${index + 1}. ${project.name} (ID: ${project.id})`
          });
          
          if (project.description) {
            content.push({
              type: "text",
              text: `   Description: ${project.description}`
            });
          }
          
          if (project.repositories && project.repositories.length > 0) {
            content.push({
              type: "text",
              text: `   Repositories: ${project.repositories.length}`
            });
          }
          
          if (project.created) {
            content.push({
              type: "text",
              text: `   Created: ${new Date(project.created).toLocaleString()}`
            });
          }
        });
        
        return { content };
      } catch (error) {
        logger.error(`Error searching projects: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error searching projects: ${error.message}`
            }
          ]
        };
      }
    }
  );
  
  // Search repositories tool
  server.tool(
    "searchRepositories",
    {
      query: z.string()
        .min(1, "Search query cannot be empty")
        .max(100, "Search query cannot exceed 100 characters")
        .describe("Search query to find matching repositories"),
      
      limit: z.number()
        .int("Limit must be an integer")
        .min(1, "Limit must be at least 1")
        .max(100, "Limit cannot exceed 100")
        .default(10)
        .optional()
        .describe("Maximum number of repositories to return (default: 10)"),
      
      projectId: z.string()
        .min(24, "Project ID must be at least 24 characters")
        .max(24, "Project ID must be at most 24 characters")
        .optional()
        .describe("Filter repositories by project ID (optional)")
    },
    async ({ query, limit = 10, projectId }) => {
      try {
        // Build search parameters
        const searchParams: any = {
          query,
          limit
        };
        
        if (projectId) {
          // Check authorization for the specific project
          const isAuthorized = await authManager.isAuthorized(`project/${projectId}`, 'read');
          if (!isAuthorized) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: You do not have permission to search repositories in project ${projectId}`
                }
              ]
            };
          }
          searchParams.project = projectId;
        }
        
        // Perform the search
        const result = await apiClient.searchRepositories(searchParams);
        
        if (!result || !result.repositories) {
          return {
            content: [
              {
                type: "text",
                text: `No repositories found matching "${query}".`
              }
            ]
          };
        }
        
        const repositories = result.repositories;
        
        if (repositories.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No repositories found matching "${query}".`
              }
            ]
          };
        }
        
        // Filter repositories based on authorization
        const authorizedRepositories = [];
        for (const repo of repositories) {
          if (repo.project?.id) {
            const isAuthorized = await authManager.isAuthorized(`project/${repo.project.id}`, 'read');
            if (isAuthorized) {
              authorizedRepositories.push(repo);
            }
          }
        }
        
        if (authorizedRepositories.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No repositories found matching "${query}" that you have permission to view.`
              }
            ]
          };
        }
        
        // Format the repositories list
        const content = [
          {
            type: "text",
            text: `Found ${authorizedRepositories.length} repositor${authorizedRepositories.length === 1 ? 'y' : 'ies'} matching "${query}":`
          }
        ];
        
        authorizedRepositories.forEach((repo, index) => {
          content.push({
            type: "text",
            text: `${index + 1}. ${repo.name} (ID: ${repo.id})`
          });
          
          if (repo.provider) {
            content.push({
              type: "text",
              text: `   Provider: ${repo.provider}`
            });
          }
          
          if (repo.url) {
            content.push({
              type: "text",
              text: `   URL: ${repo.url}`
            });
          }
          
          if (repo.project) {
            content.push({
              type: "text",
              text: `   Project: ${repo.project.name || 'Unknown'} (ID: ${repo.project.id || 'Unknown'})`
            });
          }
          
          if (repo.private !== undefined) {
            content.push({
              type: "text",
              text: `   Private: ${repo.private ? 'Yes' : 'No'}`
            });
          }
        });
        
        return { content };
      } catch (error) {
        logger.error(`Error searching repositories: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error searching repositories: ${error.message}`
            }
          ]
        };
      }
    }
  );
} 