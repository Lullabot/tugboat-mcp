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
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTools = registerTools;
const zod_1 = require("zod");
const api_client_1 = require("../utils/api-client");
const config_1 = require("../utils/config");
/**
 * Register all tools with the MCP server
 */
function registerTools(server) {
    const config = (0, config_1.getConfig)();
    const apiClient = new api_client_1.TugboatApiClient(config.apiKey, config.baseUrl);
    // Register preview tools
    registerPreviewTools(server, apiClient);
    // Register search tools
    registerSearchTools(server, apiClient);
}
/**
 * Register preview-related tools
 */
function registerPreviewTools(server, apiClient) {
    // Create preview tool
    server.tool("createPreview", {
        repoId: zod_1.z.string().describe("ID of the repository to create the preview in"),
        name: zod_1.z.string().describe("Name for the preview"),
        ref: zod_1.z.string().describe("Git reference to use for the preview (branch, tag, or commit hash)"),
        config: zod_1.z.record(zod_1.z.any()).optional().describe("Optional preview configuration")
    }, (_a) => __awaiter(this, [_a], void 0, function* ({ repoId, name, ref, config }) {
        const data = {
            name,
            ref,
            config
        };
        const preview = yield apiClient.post(`/repos/${repoId}/previews`, data);
        return {
            content: [
                {
                    type: "text",
                    text: `Preview created successfully: ${preview.id}`
                }
            ]
        };
    }));
    // Build preview tool
    server.tool("buildPreview", {
        previewId: zod_1.z.string().describe("ID of the preview to build")
    }, (_a) => __awaiter(this, [_a], void 0, function* ({ previewId }) {
        yield apiClient.post(`/previews/${previewId}/build`);
        return {
            content: [
                {
                    type: "text",
                    text: `Preview ${previewId} build started successfully`
                }
            ]
        };
    }));
    // Refresh preview tool
    server.tool("refreshPreview", {
        previewId: zod_1.z.string().describe("ID of the preview to refresh")
    }, (_a) => __awaiter(this, [_a], void 0, function* ({ previewId }) {
        yield apiClient.post(`/previews/${previewId}/refresh`);
        return {
            content: [
                {
                    type: "text",
                    text: `Preview ${previewId} refresh started successfully`
                }
            ]
        };
    }));
    // Delete preview tool
    server.tool("deletePreview", {
        previewId: zod_1.z.string().describe("ID of the preview to delete")
    }, (_a) => __awaiter(this, [_a], void 0, function* ({ previewId }) {
        yield apiClient.delete(`/previews/${previewId}`);
        return {
            content: [
                {
                    type: "text",
                    text: `Preview ${previewId} deleted successfully`
                }
            ]
        };
    }));
}
/**
 * Register search-related tools
 */
function registerSearchTools(server, apiClient) {
    // Search previews tool
    server.tool("searchPreviews", {
        query: zod_1.z.string().describe("Search query for previews")
    }, (_a) => __awaiter(this, [_a], void 0, function* ({ query }) {
        const previews = yield apiClient.get('/previews', {
            params: { q: query }
        });
        return {
            content: [
                {
                    type: "text",
                    text: `Found ${previews.length} previews matching "${query}":\n\n${JSON.stringify(previews, null, 2)}`
                }
            ]
        };
    }));
    // Search projects tool
    server.tool("searchProjects", {
        query: zod_1.z.string().describe("Search query for projects")
    }, (_a) => __awaiter(this, [_a], void 0, function* ({ query }) {
        const projects = yield apiClient.get('/projects', {
            params: { q: query }
        });
        return {
            content: [
                {
                    type: "text",
                    text: `Found ${projects.length} projects matching "${query}":\n\n${JSON.stringify(projects, null, 2)}`
                }
            ]
        };
    }));
}
