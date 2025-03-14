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
 * Register project-related tools
 */
export function registerProjectTools(server: McpServer, apiClient: TugboatApiClient, authManager: AuthManager, logger: Logger) {
  // Create project tool
  server.tool(
    "createProject",
    {
      name: z.string()
        .min(1, "Project name cannot be empty")
        .max(100, "Project name cannot exceed 100 characters")
        .describe("Name for the new project"),
      
      description: z.string()
        .max(500, "Description cannot exceed 500 characters")
        .optional()
        .describe("Optional description of the project")
    },
    async ({ name, description }) => {
      try {
        // Check authorization - only admins can create projects
        const isAuthorized = await authManager.isAdmin();
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: "Error: You do not have permission to create projects. Admin access is required."
              }
            ]
          };
        }

        // Create the project
        const result = await apiClient.createProject(name, description);
        
        if (!result || !result.project) {
          return {
            content: [
              {
                type: "text",
                text: "Error creating project. Please check your inputs and try again."
              }
            ]
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Project created successfully: ${result.project.name} (ID: ${result.project.id})`
            },
            {
              type: "text",
              text: `Description: ${result.project.description || 'None'}`
            }
          ]
        };
      } catch (error) {
        logger.error(`Error creating project: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error creating project: ${error.message}`
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
        .describe("Project ID (24 characters) to update"),
      
      name: z.string()
        .min(1, "Project name cannot be empty")
        .max(100, "Project name cannot exceed 100 characters")
        .optional()
        .describe("New name for the project (optional)"),
      
      description: z.string()
        .max(500, "Description cannot exceed 500 characters")
        .optional()
        .describe("New description for the project (optional)")
    },
    async ({ id, name, description }) => {
      try {
        // Check if at least one field to update is provided
        if (!name && !description) {
          return {
            content: [
              {
                type: "text",
                text: "Error: At least one of name or description must be provided for an update."
              }
            ]
          };
        }

        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`project/${id}`, 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to update project ${id}`
              }
            ]
          };
        }

        // Update the project
        const result = await apiClient.updateProject(id, { name, description });
        
        if (!result || !result.project) {
          return {
            content: [
              {
                type: "text",
                text: `Error updating project ${id}. Please try again.`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Project updated successfully: ${result.project.name} (ID: ${result.project.id})`
            },
            {
              type: "text",
              text: `Description: ${result.project.description || 'None'}`
            }
          ]
        };
      } catch (error) {
        logger.error(`Error updating project: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error updating project: ${error.message}`
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
        .describe("Project ID (24 characters) to delete")
    },
    async ({ id }) => {
      try {
        // Check authorization - only admins or project owners can delete projects
        const isAdmin = await authManager.isAdmin();
        const isProjectOwner = await authManager.isAuthorized(`project/${id}`, 'owner');
        
        if (!isAdmin && !isProjectOwner) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to delete project ${id}`
              }
            ]
          };
        }

        // Delete the project
        const result = await apiClient.deleteProject(id);
        
        if (!result || !result.success) {
          return {
            content: [
              {
                type: "text",
                text: `Error deleting project ${id}. Please try again.`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Project ${id} deleted successfully.`
            }
          ]
        };
      } catch (error) {
        logger.error(`Error deleting project: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error deleting project: ${error.message}`
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
        .describe("Project ID (24 characters) to retrieve")
    },
    async ({ id }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`project/${id}`, 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to view project ${id}`
              }
            ]
          };
        }

        // Get the project
        const result = await apiClient.getProject(id);
        
        if (!result || !result.project) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Project ${id} not found`
              }
            ]
          };
        }

        const project = result.project;
        
        // Get repositories
        const reposResult = await apiClient.getProjectRepositories(id);
        const repositories = reposResult?.repositories || [];
        
        // Format basic project info
        const content = [
          {
            type: "text",
            text: `Project: ${project.name} (ID: ${project.id})`
          },
          {
            type: "text", 
            text: `Description: ${project.description || 'None'}`
          },
          {
            type: "text",
            text: `Created: ${new Date(project.created).toLocaleString() || 'Unknown'}`
          },
          {
            type: "text",
            text: `Updated: ${new Date(project.updated).toLocaleString() || 'Unknown'}`
          },
          {
            type: "text",
            text: `Repositories: ${repositories.length}`
          }
        ];
        
        // Add repository info
        if (repositories.length > 0) {
          content.push({
            type: "text",
            text: "Repository List:"
          });
          
          repositories.forEach((repo, index) => {
            content.push({
              type: "text",
              text: `${index + 1}. ${repo.name} (ID: ${repo.id})`
            });
          });
        }

        return { content };
      } catch (error) {
        logger.error(`Error retrieving project: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving project: ${error.message}`
            }
          ]
        };
      }
    }
  );

  // List projects tool
  server.tool(
    "listProjects",
    {
      limit: z.number()
        .int()
        .min(1, "Limit must be at least 1")
        .max(100, "Limit cannot exceed 100")
        .default(10)
        .optional()
        .describe("Maximum number of projects to retrieve (default: 10, max: 100)"),
      
      offset: z.number()
        .int()
        .min(0, "Offset cannot be negative")
        .default(0)
        .optional()
        .describe("Number of projects to skip (default: 0)")
    },
    async ({ limit = 10, offset = 0 }) => {
      try {
        // Get projects list
        const result = await apiClient.listProjects(limit, offset);
        
        if (!result || !result.projects) {
          return {
            content: [
              {
                type: "text",
                text: "Error retrieving projects. Please try again."
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
                text: "No projects found."
              }
            ]
          };
        }

        // Format projects list
        const content = [
          {
            type: "text",
            text: `Projects (${offset + 1}-${offset + projects.length}):`
          }
        ];
        
        projects.forEach((project, index) => {
          content.push({
            type: "text",
            text: `${index + offset + 1}. ${project.name} (ID: ${project.id})`
          });
          
          if (project.description) {
            content.push({
              type: "text",
              text: `   Description: ${project.description}`
            });
          }
          
          // Add created time
          if (project.created) {
            content.push({
              type: "text",
              text: `   Created: ${new Date(project.created).toLocaleString()}`
            });
          }
        });

        return { content };
      } catch (error) {
        logger.error(`Error listing projects: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error listing projects: ${error.message}`
            }
          ]
        };
      }
    }
  );
} 