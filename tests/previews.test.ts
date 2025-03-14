import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPreviewTools } from '../src/tools/previews';
import { jest } from '@jest/globals';

interface Preview {
  id: string;
  name: string;
  repository: string;
  ref: string;
}

interface PreviewResponse {
  preview: Preview;
}

interface SuccessResponse {
  success: boolean;
}

interface LogsResponse {
  logs: string[];
}

interface MockedApiClient {
  createPreview: jest.Mock;
  buildPreview: jest.Mock;
  refreshPreview: jest.Mock;
  deletePreview: jest.Mock;
  getPreview: jest.Mock;
  getPreviewLogs: jest.Mock;
}

interface MockedAuthManager {
  isAuthorized: jest.Mock;
  refreshToken: jest.Mock;
}

interface Logger {
  log: jest.Mock;
  error: jest.Mock;
}

describe('Preview Tools', () => {
  let server: McpServer;
  let apiClient: MockedApiClient;
  let authManager: MockedAuthManager;
  let logger: Logger;

  beforeEach(() => {
    server = new McpServer({
      name: 'Test Server',
      version: '1.0.0'
    });

    apiClient = {
      createPreview: jest.fn(),
      buildPreview: jest.fn(),
      refreshPreview: jest.fn(),
      deletePreview: jest.fn(),
      getPreview: jest.fn(),
      getPreviewLogs: jest.fn()
    };

    authManager = {
      isAuthorized: jest.fn(),
      refreshToken: jest.fn()
    };

    logger = {
      log: jest.fn(),
      error: jest.fn()
    };

    registerPreviewTools(server, apiClient as any, authManager as any, logger);
  });

  describe('createPreview', () => {
    const mockPreview = {
      id: 'preview-123',
      name: 'test-preview',
      repository: 'repo-123',
      ref: 'main'
    };

    it('creates a preview when authorized', async () => {
      authManager.isAuthorized.mockResolvedValue(true);
      apiClient.createPreview.mockResolvedValue({ preview: mockPreview });
      apiClient.getPreview.mockResolvedValue(mockPreview);

      const result = await server.getTool('createPreview')({
        repo: 'repo-123',
        ref: 'main',
        name: 'test-preview'
      });

      expect(authManager.isAuthorized).toHaveBeenCalledWith('previews', 'write');
      expect(apiClient.createPreview).toHaveBeenCalledWith('repo-123', 'main', 'test-preview', undefined);
      expect(result.content).toEqual([{
        type: 'text',
        text: `Successfully created preview ${mockPreview.name} (${mockPreview.id})`
      }]);
    });

    it('returns error when unauthorized', async () => {
      authManager.isAuthorized.mockResolvedValue(false);

      const result = await server.getTool('createPreview')({
        repo: 'repo-123',
        ref: 'main'
      });

      expect(authManager.isAuthorized).toHaveBeenCalledWith('previews', 'write');
      expect(apiClient.createPreview).not.toHaveBeenCalled();
      expect(result.content).toEqual([{
        type: 'text',
        text: 'You are not authorized to create previews. Please authenticate first.'
      }]);
    });
  });

  describe('buildPreview', () => {
    const mockPreview = {
      id: 'preview-123',
      name: 'test-preview',
      repository: 'repo-123',
      ref: 'main'
    };

    it('builds a preview when authorized', async () => {
      authManager.isAuthorized.mockResolvedValue(true);
      apiClient.buildPreview.mockResolvedValue({ success: true });
      apiClient.getPreview.mockResolvedValue(mockPreview);

      const result = await server.getTool('buildPreview')({
        previewId: 'preview-123'
      });

      expect(authManager.isAuthorized).toHaveBeenCalledWith('previews', 'write');
      expect(apiClient.buildPreview).toHaveBeenCalledWith('preview-123');
      expect(result.content).toEqual([{
        type: 'text',
        text: `Successfully started build for preview ${mockPreview.name} (${mockPreview.id})`
      }]);
    });

    it('returns error when unauthorized', async () => {
      authManager.isAuthorized.mockResolvedValue(false);

      const result = await server.getTool('buildPreview')({
        previewId: 'preview-123'
      });

      expect(authManager.isAuthorized).toHaveBeenCalledWith('previews', 'write');
      expect(apiClient.buildPreview).not.toHaveBeenCalled();
      expect(result.content).toEqual([{
        type: 'text',
        text: 'You are not authorized to build previews. Please authenticate first.'
      }]);
    });
  });

  describe('refreshPreview', () => {
    const mockPreview = {
      id: 'preview-123',
      name: 'test-preview',
      repository: 'repo-123',
      ref: 'main'
    };

    it('refreshes a preview when authorized', async () => {
      authManager.isAuthorized.mockResolvedValue(true);
      apiClient.refreshPreview.mockResolvedValue({ success: true });
      apiClient.getPreview.mockResolvedValue(mockPreview);

      const result = await server.getTool('refreshPreview')({
        previewId: 'preview-123'
      });

      expect(authManager.isAuthorized).toHaveBeenCalledWith('previews', 'write');
      expect(apiClient.refreshPreview).toHaveBeenCalledWith('preview-123');
      expect(result.content).toEqual([{
        type: 'text',
        text: `Successfully started refresh for preview ${mockPreview.name} (${mockPreview.id})`
      }]);
    });

    it('returns error when unauthorized', async () => {
      authManager.isAuthorized.mockResolvedValue(false);

      const result = await server.getTool('refreshPreview')({
        previewId: 'preview-123'
      });

      expect(authManager.isAuthorized).toHaveBeenCalledWith('previews', 'write');
      expect(apiClient.refreshPreview).not.toHaveBeenCalled();
      expect(result.content).toEqual([{
        type: 'text',
        text: 'You are not authorized to refresh previews. Please authenticate first.'
      }]);
    });
  });

  describe('deletePreview', () => {
    const mockPreview = {
      id: 'preview-123',
      name: 'test-preview',
      repository: 'repo-123',
      ref: 'main'
    };

    it('deletes a preview when authorized', async () => {
      authManager.isAuthorized.mockResolvedValue(true);
      apiClient.deletePreview.mockResolvedValue({ success: true });
      apiClient.getPreview.mockResolvedValue(mockPreview);

      const result = await server.getTool('deletePreview')({
        previewId: 'preview-123'
      });

      expect(authManager.isAuthorized).toHaveBeenCalledWith('previews', 'write');
      expect(apiClient.deletePreview).toHaveBeenCalledWith('preview-123');
      expect(result.content).toEqual([{
        type: 'text',
        text: `Successfully deleted preview ${mockPreview.name} (${mockPreview.id})`
      }]);
    });

    it('returns error when unauthorized', async () => {
      authManager.isAuthorized.mockResolvedValue(false);

      const result = await server.getTool('deletePreview')({
        previewId: 'preview-123'
      });

      expect(authManager.isAuthorized).toHaveBeenCalledWith('previews', 'write');
      expect(apiClient.deletePreview).not.toHaveBeenCalled();
      expect(result.content).toEqual([{
        type: 'text',
        text: 'You are not authorized to delete previews. Please authenticate first.'
      }]);
    });
  });

  describe('getPreviewLogs', () => {
    it('returns logs when authorized', async () => {
      authManager.isAuthorized.mockResolvedValue(true);
      apiClient.getPreviewLogs.mockResolvedValue({
        logs: ['log1', 'log2']
      });

      const result = await server.getTool('getPreviewLogs')({
        previewId: 'preview-123'
      });

      expect(authManager.isAuthorized).toHaveBeenCalledWith('previews', 'read');
      expect(apiClient.getPreviewLogs).toHaveBeenCalledWith('preview-123', undefined);
      expect(result.content).toEqual([
        { type: 'text', text: 'log1' },
        { type: 'text', text: 'log2' }
      ]);
    });

    it('returns error when unauthorized', async () => {
      authManager.isAuthorized.mockResolvedValue(false);

      const result = await server.getTool('getPreviewLogs')({
        previewId: 'preview-123'
      });

      expect(authManager.isAuthorized).toHaveBeenCalledWith('previews', 'read');
      expect(apiClient.getPreviewLogs).not.toHaveBeenCalled();
      expect(result.content).toEqual([{
        type: 'text',
        text: 'You are not authorized to view preview logs. Please authenticate first.'
      }]);
    });

    it('returns message when no logs available', async () => {
      authManager.isAuthorized.mockResolvedValue(true);
      apiClient.getPreviewLogs.mockResolvedValue({
        logs: []
      });

      const result = await server.getTool('getPreviewLogs')({
        previewId: 'preview-123'
      });

      expect(authManager.isAuthorized).toHaveBeenCalledWith('previews', 'read');
      expect(apiClient.getPreviewLogs).toHaveBeenCalledWith('preview-123', undefined);
      expect(result.content).toEqual([{
        type: 'text',
        text: 'No logs available for this preview.'
      }]);
    });
  });
});