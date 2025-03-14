import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TugboatApiClient } from '../utils/api-client';
import { AuthManager } from '../utils/auth';
import { z } from 'zod';

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

interface PreviewData {
  id: string;
  name: string;
  repository: string;
  ref: string;
  status: string;
  // Add other fields as needed
}

interface ApiError extends Error {
  message: string;
}

/**
 * Register preview-related tools
 */
export function registerPreviewTools(
  server: McpServer,
  apiClient: TugboatApiClient,
  authManager: AuthManager,
  logger: Logger
) {
  server.tool(
    'createPreview',
    {
      repo: z.string().describe('Repository ID to create the preview in'),
      ref: z.string().describe('Git reference to use for the preview'),
      name: z.string().optional().describe('Name for the preview (optional)'),
      config: z.record(z.any()).optional().describe('Optional preview configuration')
    },
    async (args, extra) => {
      try {
        const { repo, ref, name, config } = args;
        const isAuthorized = await authManager.isAuthorized('previews', 'write');
        if (!isAuthorized) {
          return {
            content: [{
              type: 'text' as const,
              text: 'You are not authorized to create previews. Please authenticate first.'
            }]
          };
        }

        const result = await apiClient.createPreview(repo, ref, name, config);
        const previewId = result.preview.id;

        try {
          const previewData = await apiClient.getPreview(previewId);
          return {
            content: [
              {
                type: 'text' as const,
                text: `Successfully created preview ${previewData.name} (${previewData.id})`
              }
            ]
          };
        } catch (error) {
          const apiError = error as ApiError;
          logger.error(`Error creating preview: ${apiError.message}`);
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error creating preview: ${apiError.message}`
              }
            ]
          };
        }
      } catch (error) {
        const apiError = error as ApiError;
        logger.error(`Error creating preview: ${apiError.message}`);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error creating preview: ${apiError.message}`
            }
          ]
        };
      }
    }
  );

  server.tool(
    'buildPreview',
    {
      previewId: z.string().describe('ID of the preview to build')
    },
    async (args, extra) => {
      try {
        const { previewId } = args;
        const isAuthorized = await authManager.isAuthorized('previews', 'write');
        if (!isAuthorized) {
          return {
            content: [{
              type: 'text' as const,
              text: 'You are not authorized to build previews. Please authenticate first.'
            }]
          };
        }

        const result = await apiClient.buildPreview(previewId);
        if (result.success) {
          try {
            const previewData = await apiClient.getPreview(previewId);
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Successfully started build for preview ${previewData.name} (${previewData.id})`
                }
              ]
            };
          } catch (error) {
            const apiError = error as ApiError;
            logger.error(`Error building preview: ${apiError.message}`);
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Error building preview: ${apiError.message}`
                }
              ]
            };
          }
        }
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Failed to start build'
            }
          ]
        };
      } catch (error) {
        const apiError = error as ApiError;
        logger.error(`Error building preview: ${apiError.message}`);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error building preview: ${apiError.message}`
            }
          ]
        };
      }
    }
  );

  server.tool(
    'refreshPreview',
    {
      previewId: z.string().describe('ID of the preview to refresh')
    },
    async (args, extra) => {
      try {
        const { previewId } = args;
        const isAuthorized = await authManager.isAuthorized('previews', 'write');
        if (!isAuthorized) {
          return {
            content: [{
              type: 'text' as const,
              text: 'You are not authorized to refresh previews. Please authenticate first.'
            }]
          };
        }

        const result = await apiClient.refreshPreview(previewId);
        if (result.success) {
          try {
            const previewData = await apiClient.getPreview(previewId);
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Successfully started refresh for preview ${previewData.name} (${previewData.id})`
                }
              ]
            };
          } catch (error) {
            const apiError = error as ApiError;
            logger.error(`Error refreshing preview: ${apiError.message}`);
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Error refreshing preview: ${apiError.message}`
                }
              ]
            };
          }
        }
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Failed to start refresh'
            }
          ]
        };
      } catch (error) {
        const apiError = error as ApiError;
        logger.error(`Error refreshing preview: ${apiError.message}`);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error refreshing preview: ${apiError.message}`
            }
          ]
        };
      }
    }
  );

  server.tool(
    'deletePreview',
    {
      previewId: z.string().describe('ID of the preview to delete')
    },
    async (args, extra) => {
      try {
        const { previewId } = args;
        const isAuthorized = await authManager.isAuthorized('previews', 'write');
        if (!isAuthorized) {
          return {
            content: [{
              type: 'text' as const,
              text: 'You are not authorized to delete previews. Please authenticate first.'
            }]
          };
        }

        try {
          const previewData = await apiClient.getPreview(previewId);
          const result = await apiClient.deletePreview(previewId);
          if (result.success) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Successfully deleted preview ${previewData.name} (${previewData.id})`
                }
              ]
            };
          }
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Failed to delete preview'
              }
            ]
          };
        } catch (error) {
          const apiError = error as ApiError;
          logger.error(`Error deleting preview: ${apiError.message}`);
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error deleting preview: ${apiError.message}`
              }
            ]
          };
        }
      } catch (error) {
        const apiError = error as ApiError;
        logger.error(`Error deleting preview: ${apiError.message}`);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error deleting preview: ${apiError.message}`
            }
          ]
        };
      }
    }
  );

  server.tool(
    'getPreviewLogs',
    {
      previewId: z.string().describe('ID of the preview to get logs for'),
      lines: z.number().optional().describe('Number of log lines to return (optional)')
    },
    async (args, extra) => {
      try {
        const { previewId, lines } = args;
        const isAuthorized = await authManager.isAuthorized('previews', 'read');
        if (!isAuthorized) {
          return {
            content: [{
              type: 'text' as const,
              text: 'You are not authorized to view preview logs. Please authenticate first.'
            }]
          };
        }

        const result = await apiClient.getPreviewLogs(previewId, lines);
        const logEntries = result.logs.map((log: string) => {
          return {
            type: 'text' as const,
            text: log
          };
        });

        return {
          content: logEntries.length > 0 ? logEntries : [{
            type: 'text' as const,
            text: 'No logs available for this preview.'
          }]
        };
      } catch (error) {
        const apiError = error as ApiError;
        logger.error(`Error retrieving preview logs: ${apiError.message}`);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error retrieving preview logs: ${apiError.message}`
            }
          ]
        };
      }
    }
  );
} 