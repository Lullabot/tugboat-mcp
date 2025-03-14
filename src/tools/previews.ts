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
 * Register preview-related tools
 */
export function registerPreviewTools(server: McpServer, apiClient: TugboatApiClient, authManager: AuthManager, logger: Logger) {
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

        // Create the preview
        const result = await apiClient.createPreview(repo, ref, name, config);
        
        if (!result || !result.preview) {
          return {
            content: [
              {
                type: "text",
                text: "Error creating preview. Please check your inputs and try again."
              }
            ]
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Preview created successfully: ${result.preview.name} (ID: ${result.preview.id})`
            },
            {
              type: "text",
              text: `Status: ${result.preview.status || 'Unknown'}`
            },
            {
              type: "text",
              text: `URL: ${result.preview.url || 'Not available yet'}`
            }
          ]
        };
      } catch (error) {
        logger.error(`Error creating preview: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error creating preview: ${error.message}`
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
      id: z.string()
        .min(24, "Preview ID must be at least 24 characters")
        .max(24, "Preview ID must be at most 24 characters")
        .describe("Preview ID (24 characters) to build")
    },
    async ({ id }) => {
      try {
        // Get the preview first to check authorization
        const previewData = await apiClient.getPreview(id);
        if (!previewData || !previewData.preview) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Preview ${id} not found`
              }
            ]
          };
        }

        // Check authorization
        const repo = previewData.preview.repository?.id;
        if (!repo) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Could not determine repository for preview ${id}`
              }
            ]
          };
        }

        const isAuthorized = await authManager.isAuthorized(`repository/${repo}`, 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to build preview ${id}`
              }
            ]
          };
        }

        // Build the preview
        const result = await apiClient.buildPreview(id);
        
        if (!result || !result.preview) {
          return {
            content: [
              {
                type: "text",
                text: `Error building preview ${id}. Please try again.`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Build started for preview: ${result.preview.name} (ID: ${result.preview.id})`
            },
            {
              type: "text",
              text: `Status: ${result.preview.status || 'Unknown'}`
            },
            {
              type: "text",
              text: `You can check the build progress with the getPreviewLogs tool.`
            }
          ]
        };
      } catch (error) {
        logger.error(`Error building preview: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error building preview: ${error.message}`
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
      id: z.string()
        .min(24, "Preview ID must be at least 24 characters")
        .max(24, "Preview ID must be at most 24 characters")
        .describe("Preview ID (24 characters) to refresh")
    },
    async ({ id }) => {
      try {
        // Get the preview first to check authorization
        const previewData = await apiClient.getPreview(id);
        if (!previewData || !previewData.preview) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Preview ${id} not found`
              }
            ]
          };
        }

        // Check authorization
        const repo = previewData.preview.repository?.id;
        if (!repo) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Could not determine repository for preview ${id}`
              }
            ]
          };
        }

        const isAuthorized = await authManager.isAuthorized(`repository/${repo}`, 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to refresh preview ${id}`
              }
            ]
          };
        }

        // Refresh the preview
        const result = await apiClient.refreshPreview(id);
        
        if (!result || !result.preview) {
          return {
            content: [
              {
                type: "text",
                text: `Error refreshing preview ${id}. Please try again.`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Refresh started for preview: ${result.preview.name} (ID: ${result.preview.id})`
            },
            {
              type: "text",
              text: `Status: ${result.preview.status || 'Unknown'}`
            },
            {
              type: "text",
              text: `You can check the refresh progress with the getPreviewLogs tool.`
            }
          ]
        };
      } catch (error) {
        logger.error(`Error refreshing preview: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error refreshing preview: ${error.message}`
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
      id: z.string()
        .min(24, "Preview ID must be at least 24 characters")
        .max(24, "Preview ID must be at most 24 characters")
        .describe("Preview ID (24 characters) to delete")
    },
    async ({ id }) => {
      try {
        // Get the preview first to check authorization
        const previewData = await apiClient.getPreview(id);
        if (!previewData || !previewData.preview) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Preview ${id} not found`
              }
            ]
          };
        }

        // Check authorization
        const repo = previewData.preview.repository?.id;
        if (!repo) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Could not determine repository for preview ${id}`
              }
            ]
          };
        }

        const isAuthorized = await authManager.isAuthorized(`repository/${repo}`, 'write');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to delete preview ${id}`
              }
            ]
          };
        }

        // Delete the preview
        const result = await apiClient.deletePreview(id);
        
        if (!result || !result.success) {
          return {
            content: [
              {
                type: "text",
                text: `Error deleting preview ${id}. Please try again.`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Preview ${id} deleted successfully.`
            }
          ]
        };
      } catch (error) {
        logger.error(`Error deleting preview: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error deleting preview: ${error.message}`
            }
          ]
        };
      }
    }
  );

  // Get preview logs tool
  server.tool(
    "getPreviewLogs",
    {
      id: z.string()
        .min(24, "Preview ID must be at least 24 characters")
        .max(24, "Preview ID must be at most 24 characters")
        .describe("Preview ID (24 characters) to get logs for"),
      
      lines: z.number()
        .int()
        .min(1, "Lines must be at least 1")
        .max(1000, "Lines cannot exceed 1000")
        .default(100)
        .optional()
        .describe("Number of log lines to retrieve (default: 100, max: 1000)")
    },
    async ({ id, lines = 100 }) => {
      try {
        // Get the preview first to check authorization
        const previewData = await apiClient.getPreview(id);
        if (!previewData || !previewData.preview) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Preview ${id} not found`
              }
            ]
          };
        }

        // Check authorization
        const repo = previewData.preview.repository?.id;
        if (!repo) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Could not determine repository for preview ${id}`
              }
            ]
          };
        }

        const isAuthorized = await authManager.isAuthorized(`repository/${repo}`, 'read');
        if (!isAuthorized) {
          return {
            content: [
              {
                type: "text",
                text: `Error: You do not have permission to view logs for preview ${id}`
              }
            ]
          };
        }

        // Get the logs
        const result = await apiClient.getPreviewLogs(id, lines);
        
        if (!result || !result.logs) {
          return {
            content: [
              {
                type: "text",
                text: `No logs available for preview ${id} or error retrieving logs.`
              }
            ]
          };
        }

        const previewInfo = [
          {
            type: "text",
            text: `Logs for preview: ${previewData.preview.name} (ID: ${id})`
          },
          {
            type: "text",
            text: `Status: ${previewData.preview.status || 'Unknown'}`
          },
          {
            type: "text",
            text: `Last ${result.logs.length} log entries:`
          }
        ];

        // Format log entries
        const logEntries = result.logs.map(log => {
          return {
            type: "text",
            text: `[${log.timestamp || 'Unknown time'}] ${log.message}`
          };
        });

        return {
          content: [...previewInfo, ...logEntries]
        };
      } catch (error) {
        logger.error(`Error retrieving preview logs: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving preview logs: ${error.message}`
            }
          ]
        };
      }
    }
  );
} 