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
 * Register repository-related tools
 */
export function registerRepositoryTools(server: McpServer, apiClient: TugboatApiClient, authManager: AuthManager, logger: Logger) {
  // Create repository tool
  server.tool(
    "createRepository",
    {
      project: z.string()
        .min(24, "Project ID must be at least 24 characters")
        .max(24, "Project ID must be at most 24 characters")
        .describe("Project ID (24 characters) to add the repository to"),
      
      name: z.string()
        .min(1, "Repository name cannot be empty")
        .max(100, "Repository name cannot exceed 100 characters")
        .describe("Name for the new repository"),
      
      provider: z.enum(["github", "gitlab", "bitbucket"])
        .describe("Git provider for the repository"),
      
      url: z.string()
        .url("Repository URL must be a valid URL")
        .describe("URL of the Git repository"),
      
      privateRepo: z.boolean()
        .default(false)
        .optional()
        .describe("Whether the repository is private (default: false)"),
      
      buildSettings: z.record(z.any())
        .optional()
        .describe("Optional build settings for the repository")
    },
    async ({ project, name, provider, url, privateRepo = false, buildSettings }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`project/${project}`, 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to create repositories in project ${project}`
              }
            ]
          };
        }

        // Create the repository
        const result = await apiClient.createRepository(project, name, provider, url, privateRepo, buildSettings);
        
        if (!result || !result.repository) {
          return {
            content: [
              {
                type: "text",
                text: "Error creating repository. Please check your inputs and try again."
              }
            ]
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Repository created successfully: ${result.repository.name} (ID: ${result.repository.id})`
            },
            {
              type: "text",
              text: `Provider: ${result.repository.provider}`
            },
            {
              type: "text",
              text: `URL: ${result.repository.url}`
            },
            {
              type: "text",
              text: `Private: ${result.repository.private ? 'Yes' : 'No'}`
            }
          ]
        };
      } catch (error) {
        logger.error(`Error creating repository: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error creating repository: ${error.message}`
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
        .describe("Repository ID (24 characters) to update"),
      
      name: z.string()
        .min(1, "Repository name cannot be empty")
        .max(100, "Repository name cannot exceed 100 characters")
        .optional()
        .describe("New name for the repository (optional)"),
      
      url: z.string()
        .url("Repository URL must be a valid URL")
        .optional()
        .describe("New URL for the repository (optional)"),
      
      privateRepo: z.boolean()
        .optional()
        .describe("Whether the repository is private (optional)"),
      
      buildSettings: z.record(z.any())
        .optional()
        .describe("New build settings for the repository (optional)")
    },
    async ({ id, name, url, privateRepo, buildSettings }) => {
      try {
        // Check if at least one field to update is provided
        if (!name && !url && privateRepo === undefined && !buildSettings) {
          return {
            content: [
              {
                type: "text",
                text: "Error: At least one field must be provided for an update."
              }
            ]
          };
        }

        // Get the repository first to check authorization
        const repoData = await apiClient.getRepository(id);
        if (!repoData || !repoData.repository) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Repository ${id} not found`
              }
            ]
          };
        }

        // Check authorization
        const project = repoData.repository.project?.id;
        if (!project) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Could not determine project for repository ${id}`
              }
            ]
          };
        }

        const isAuthorized = await authManager.isAuthorized(`project/${project}`, 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to update repository ${id}`
              }
            ]
          };
        }

        // Update the repository
        const result = await apiClient.updateRepository(id, { name, url, private: privateRepo, buildSettings });
        
        if (!result || !result.repository) {
          return {
            content: [
              {
                type: "text",
                text: `Error updating repository ${id}. Please try again.`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Repository updated successfully: ${result.repository.name} (ID: ${result.repository.id})`
            },
            {
              type: "text",
              text: `URL: ${result.repository.url}`
            },
            {
              type: "text",
              text: `Private: ${result.repository.private ? 'Yes' : 'No'}`
            }
          ]
        };
      } catch (error) {
        logger.error(`Error updating repository: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error updating repository: ${error.message}`
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
        .describe("Repository ID (24 characters) to delete")
    },
    async ({ id }) => {
      try {
        // Get the repository first to check authorization
        const repoData = await apiClient.getRepository(id);
        if (!repoData || !repoData.repository) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Repository ${id} not found`
              }
            ]
          };
        }

        // Check authorization
        const project = repoData.repository.project?.id;
        if (!project) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Could not determine project for repository ${id}`
              }
            ]
          };
        }

        const isAuthorized = await authManager.isAuthorized(`project/${project}`, 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to delete repository ${id}`
              }
            ]
          };
        }

        // Delete the repository
        const result = await apiClient.deleteRepository(id);
        
        if (!result || !result.success) {
          return {
            content: [
              {
                type: "text",
                text: `Error deleting repository ${id}. Please try again.`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Repository ${id} deleted successfully.`
            }
          ]
        };
      } catch (error) {
        logger.error(`Error deleting repository: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error deleting repository: ${error.message}`
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
        .describe("Repository ID (24 characters) to retrieve")
    },
    async ({ id }) => {
      try {
        // Get the repository
        const result = await apiClient.getRepository(id);
        
        if (!result || !result.repository) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Repository ${id} not found`
              }
            ]
          };
        }

        const repo = result.repository;
        
        // Check authorization
        const project = repo.project?.id;
        if (!project) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Could not determine project for repository ${id}`
              }
            ]
          };
        }

        const isAuthorized = await authManager.isAuthorized(`project/${project}`, 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to view repository ${id}`
              }
            ]
          };
        }
        
        // Get previews
        const previewsResult = await apiClient.getRepositoryPreviews(id);
        const previews = previewsResult?.previews || [];
        
        // Format basic repository info
        const content = [
          {
            type: "text",
            text: `Repository: ${repo.name} (ID: ${repo.id})`
          },
          {
            type: "text", 
            text: `Provider: ${repo.provider || 'Unknown'}`
          },
          {
            type: "text",
            text: `URL: ${repo.url || 'Unknown'}`
          },
          {
            type: "text",
            text: `Private: ${repo.private ? 'Yes' : 'No'}`
          },
          {
            type: "text",
            text: `Project: ${repo.project?.name || 'Unknown'} (ID: ${repo.project?.id || 'Unknown'})`
          },
          {
            type: "text",
            text: `Created: ${new Date(repo.created).toLocaleString() || 'Unknown'}`
          },
          {
            type: "text",
            text: `Updated: ${new Date(repo.updated).toLocaleString() || 'Unknown'}`
          },
          {
            type: "text",
            text: `Previews: ${previews.length}`
          }
        ];
        
        // Add preview info
        if (previews.length > 0) {
          content.push({
            type: "text",
            text: "Preview List:"
          });
          
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
          });
        }

        return { content };
      } catch (error) {
        logger.error(`Error retrieving repository: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving repository: ${error.message}`
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
        .describe("Repository ID (24 characters) to get branches for")
    },
    async ({ id }) => {
      try {
        // Get the repository first to check authorization
        const repoData = await apiClient.getRepository(id);
        if (!repoData || !repoData.repository) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Repository ${id} not found`
              }
            ]
          };
        }

        // Check authorization
        const project = repoData.repository.project?.id;
        if (!project) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Could not determine project for repository ${id}`
              }
            ]
          };
        }

        const isAuthorized = await authManager.isAuthorized(`project/${project}`, 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to view branches for repository ${id}`
              }
            ]
          };
        }

        // Get the branches
        const result = await apiClient.getRepositoryBranches(id);
        
        if (!result || !result.branches) {
          return {
            content: [
              {
                type: "text",
                text: `No branches found for repository ${id} or error retrieving branches.`
              }
            ]
          };
        }

        const branches = result.branches;
        
        if (branches.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No branches found for repository ${repoData.repository.name} (ID: ${id}).`
              }
            ]
          };
        }

        // Format branches list
        const content = [
          {
            type: "text",
            text: `Branches for repository ${repoData.repository.name} (ID: ${id}):`
          }
        ];
        
        branches.forEach((branch, index) => {
          content.push({
            type: "text",
            text: `${index + 1}. ${branch.name}`
          });
          
          if (branch.commit) {
            content.push({
              type: "text",
              text: `   Latest commit: ${branch.commit.substring(0, 8)}`
            });
          }
        });

        return { content };
      } catch (error) {
        logger.error(`Error retrieving repository branches: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving repository branches: ${error.message}`
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
        .describe("Repository ID (24 characters) to get pull requests for")
    },
    async ({ id }) => {
      try {
        // Get the repository first to check authorization
        const repoData = await apiClient.getRepository(id);
        if (!repoData || !repoData.repository) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Repository ${id} not found`
              }
            ]
          };
        }

        // Check authorization
        const project = repoData.repository.project?.id;
        if (!project) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Could not determine project for repository ${id}`
              }
            ]
          };
        }

        const isAuthorized = await authManager.isAuthorized(`project/${project}`, 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to view pull requests for repository ${id}`
              }
            ]
          };
        }

        // Get the pull requests
        const result = await apiClient.getRepositoryPullRequests(id);
        
        if (!result || !result.pullRequests) {
          return {
            content: [
              {
                type: "text",
                text: `No pull requests found for repository ${id} or error retrieving pull requests.`
              }
            ]
          };
        }

        const prs = result.pullRequests;
        
        if (prs.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No pull requests found for repository ${repoData.repository.name} (ID: ${id}).`
              }
            ]
          };
        }

        // Format pull requests list
        const content = [
          {
            type: "text",
            text: `Pull Requests for repository ${repoData.repository.name} (ID: ${id}):`
          }
        ];
        
        prs.forEach((pr, index) => {
          content.push({
            type: "text",
            text: `${index + 1}. #${pr.number} - ${pr.title}`
          });
          
          if (pr.author) {
            content.push({
              type: "text",
              text: `   Author: ${pr.author}`
            });
          }
          
          if (pr.state) {
            content.push({
              type: "text",
              text: `   State: ${pr.state}`
            });
          }
          
          if (pr.url) {
            content.push({
              type: "text",
              text: `   URL: ${pr.url}`
            });
          }
        });

        return { content };
      } catch (error) {
        logger.error(`Error retrieving repository pull requests: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving repository pull requests: ${error.message}`
            }
          ]
        };
      }
    }
  );
} 