import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TugboatApiClient } from "../utils/api-client";
import { getConfig } from "../utils/config";
import { AuthManager } from "../utils/auth";

// Logger interface
interface Logger {
  log: (message: string) => void;
  error: (message: string) => void;
}

/**
 * Register all resources with the MCP server
 */
export function registerResources(server: McpServer, logger?: Logger) {
  const config = getConfig();
  const apiClient = new TugboatApiClient(config.apiKey, config.baseUrl);
  const authManager = new AuthManager(apiClient);
  
  // Use console as fallback if no logger provided
  const log = logger || {
    log: console.log,
    error: console.error
  };
  
  // Register project resources
  registerProjectResources(server, apiClient, authManager, log);
  
  // Register preview resources
  registerPreviewResources(server, apiClient, authManager, log);
  
  // Register repository resources
  registerRepoResources(server, apiClient, authManager, log);
}

/**
 * Register project-related resources
 */
function registerProjectResources(server: McpServer, apiClient: TugboatApiClient, authManager: AuthManager, logger: Logger) {
  // List projects resource
  server.resource(
    "projects",
    new ResourceTemplate("tugboat://projects", { list: undefined }),
    async (uri) => {
      // Check authorization
      const isAuthorized = await authManager.isAuthorized('projects', 'read');
      if (!isAuthorized) {
        throw new Error('You do not have permission to access projects');
      }
      
      logger.log("Fetching projects");
      const projects = await apiClient.get('/projects');
      
      return {
        contents: [
          {
            uri: uri.href,
            metadata: {
              title: "Tugboat Projects",
              description: "List of all Tugboat projects"
            },
            text: JSON.stringify(projects, null, 2)
          }
        ]
      };
    }
  );
  
  // Single project resource
  server.resource(
    "project",
    new ResourceTemplate("tugboat://project/{id}", { list: undefined }),
    async (uri, { id }) => {
      // Check authorization
      const isAuthorized = await authManager.isAuthorized(`project/${id}`, 'read');
      if (!isAuthorized) {
        throw new Error(`You do not have permission to access project ${id}`);
      }
      
      logger.log(`Fetching project ${id}`);
      const project = await apiClient.get(`/projects/${id}`);
      
      return {
        contents: [
          {
            uri: uri.href,
            metadata: {
              title: `Project: ${project.name || id}`,
              description: `Details for Tugboat project ${id}`
            },
            text: JSON.stringify(project, null, 2)
          }
        ]
      };
    }
  );
}

/**
 * Register preview-related resources
 */
function registerPreviewResources(server: McpServer, apiClient: TugboatApiClient, authManager: AuthManager, logger: Logger) {
  // List previews resource
  server.resource(
    "previews",
    new ResourceTemplate("tugboat://previews", { list: undefined }),
    async (uri) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('previews', 'read');
        if (!isAuthorized) {
          throw new Error('You do not have permission to access previews');
        }
        
        logger.log("Attempting to fetch previews...");
        
        // Try to get all previews across all projects
        try {
          const previews = await apiClient.get('/previews');
          logger.log(`Fetched ${previews ? previews.length : 0} previews`);
          
          return {
            contents: [
              {
                uri: uri.href,
                metadata: {
                  title: "Tugboat Previews",
                  description: "List of all Tugboat previews"
                },
                text: JSON.stringify(previews, null, 2)
              }
            ]
          };
        } catch (previewsError: any) {
          logger.error(`Error fetching global previews: ${previewsError.message || 'Unknown error'}`);
          
          // If direct previews endpoint fails, try to fetch projects and then get previews for each project
          logger.log("Fetching projects instead");
          const projects = await apiClient.get('/projects');
          
          // If we have projects, try to get previews for each project
          if (Array.isArray(projects) && projects.length > 0) {
            logger.log(`Attempting to fetch previews for ${projects.length} projects`);
            
            // Collect all previews
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
            
            logger.log(`Collected a total of ${allPreviews.length} previews from all projects`);
            return {
              contents: [
                {
                  uri: uri.href,
                  metadata: {
                    title: "Tugboat Previews",
                    description: "List of all Tugboat previews (collected from projects)"
                  },
                  text: JSON.stringify(allPreviews, null, 2)
                }
              ]
            };
          } else {
            // If we couldn't get any projects or previews
            logger.log("No previews or projects found");
            return {
              contents: [
                {
                  uri: uri.href,
                  metadata: {
                    title: "Tugboat Previews",
                    description: "No previews found"
                  },
                  text: "No previews found. This could be due to an API limitation or because there are no previews available."
                }
              ]
            };
          }
        }
      } catch (error: any) {
        logger.error(`Error in previews resource: ${error.message || 'Unknown error'}`);
        
        return {
          contents: [
            {
              uri: uri.href,
              metadata: {
                title: "Tugboat Previews Error",
                description: "Error fetching previews"
              },
              text: `Error fetching previews: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Single preview resource
  server.resource(
    "preview",
    new ResourceTemplate("tugboat://preview/{id}", { list: undefined }),
    async (uri, { id }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`preview/${id}`, 'read');
        if (!isAuthorized) {
          throw new Error(`You do not have permission to access preview ${id}`);
        }
        
        logger.log(`Fetching preview ${id}`);
        const preview = await apiClient.get(`/previews/${id}`);
        
        return {
          contents: [
            {
              uri: uri.href,
              metadata: {
                title: `Preview: ${preview.name || id}`,
                description: `Details for Tugboat preview ${id}`
              },
              text: JSON.stringify(preview, null, 2)
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error fetching preview ${id}: ${error.message || 'Unknown error'}`);
        
        return {
          contents: [
            {
              uri: uri.href,
              metadata: {
                title: `Preview Error: ${id}`,
                description: `Error fetching preview ${id}`
              },
              text: `Error fetching preview: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Preview logs resource
  server.resource(
    "previewLogs",
    new ResourceTemplate("tugboat://preview/{id}/logs", { list: undefined }),
    async (uri, { id }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`preview/${id}/logs`, 'read');
        if (!isAuthorized) {
          throw new Error(`You do not have permission to access logs for preview ${id}`);
        }
        
        logger.log(`Fetching logs for preview ${id}`);
        const logs = await apiClient.get(`/previews/${id}/logs`);
        
        return {
          contents: [
            {
              uri: uri.href,
              metadata: {
                title: `Preview Logs: ${id}`,
                description: `Logs for Tugboat preview ${id}`
              },
              text: logs
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error fetching logs for preview ${id}: ${error.message || 'Unknown error'}`);
        
        return {
          contents: [
            {
              uri: uri.href,
              metadata: {
                title: `Preview Logs Error: ${id}`,
                description: `Error fetching logs for preview ${id}`
              },
              text: `Error fetching preview logs: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
}

/**
 * Register repository-related resources
 */
function registerRepoResources(server: McpServer, apiClient: TugboatApiClient, authManager: AuthManager, logger: Logger) {
  // List repositories resource
  server.resource(
    "repositories",
    new ResourceTemplate("tugboat://repositories", { list: undefined }),
    async (uri) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized('repositories', 'read');
        if (!isAuthorized) {
          throw new Error('You do not have permission to access repositories');
        }
        
        logger.log("Fetching repositories");
        const repos = await apiClient.get('/repos');
        
        return {
          contents: [
            {
              uri: uri.href,
              metadata: {
                title: "Tugboat Repositories",
                description: "List of all Tugboat repositories"
              },
              text: JSON.stringify(repos, null, 2)
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error fetching repositories: ${error.message || 'Unknown error'}`);
        
        return {
          contents: [
            {
              uri: uri.href,
              metadata: {
                title: "Tugboat Repositories Error",
                description: "Error fetching repositories"
              },
              text: `Error fetching repositories: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
  
  // Single repository resource
  server.resource(
    "repository",
    new ResourceTemplate("tugboat://repository/{id}", { list: undefined }),
    async (uri, { id }) => {
      try {
        // Check authorization
        const isAuthorized = await authManager.isAuthorized(`repository/${id}`, 'read');
        if (!isAuthorized) {
          throw new Error(`You do not have permission to access repository ${id}`);
        }
        
        logger.log(`Fetching repository ${id}`);
        const repo = await apiClient.get(`/repos/${id}`);
        
        return {
          contents: [
            {
              uri: uri.href,
              metadata: {
                title: `Repository: ${repo.name || id}`,
                description: `Details for Tugboat repository ${id}`
              },
              text: JSON.stringify(repo, null, 2)
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Error fetching repository ${id}: ${error.message || 'Unknown error'}`);
        
        return {
          contents: [
            {
              uri: uri.href,
              metadata: {
                title: `Repository Error: ${id}`,
                description: `Error fetching repository ${id}`
              },
              text: `Error fetching repository: ${error.message || 'Unknown error'}`
            }
          ]
        };
      }
    }
  );
} 