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
exports.registerResources = registerResources;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const api_client_1 = require("../utils/api-client");
const config_1 = require("../utils/config");
/**
 * Register all resources with the MCP server
 */
function registerResources(server) {
    const config = (0, config_1.getConfig)();
    const apiClient = new api_client_1.TugboatApiClient(config.apiKey, config.baseUrl);
    // Register project resources
    registerProjectResources(server, apiClient);
    // Register preview resources
    registerPreviewResources(server, apiClient);
    // Register repository resources
    registerRepoResources(server, apiClient);
}
/**
 * Register project-related resources
 */
function registerProjectResources(server, apiClient) {
    // List projects resource
    server.resource("projects", new mcp_js_1.ResourceTemplate("tugboat://projects", { list: undefined }), (uri) => __awaiter(this, void 0, void 0, function* () {
        const projects = yield apiClient.get('/projects');
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
    }));
    // Single project resource
    server.resource("project", new mcp_js_1.ResourceTemplate("tugboat://project/{id}", { list: undefined }), (uri_1, _a) => __awaiter(this, [uri_1, _a], void 0, function* (uri, { id }) {
        const project = yield apiClient.get(`/projects/${id}`);
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
    }));
}
/**
 * Register preview-related resources
 */
function registerPreviewResources(server, apiClient) {
    // List previews resource
    server.resource("previews", new mcp_js_1.ResourceTemplate("tugboat://previews", { list: undefined }), (uri) => __awaiter(this, void 0, void 0, function* () {
        const previews = yield apiClient.get('/previews');
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
    }));
    // Single preview resource
    server.resource("preview", new mcp_js_1.ResourceTemplate("tugboat://preview/{id}", { list: undefined }), (uri_1, _a) => __awaiter(this, [uri_1, _a], void 0, function* (uri, { id }) {
        const preview = yield apiClient.get(`/previews/${id}`);
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
    }));
    // Preview logs resource
    server.resource("previewLogs", new mcp_js_1.ResourceTemplate("tugboat://preview/{id}/logs", { list: undefined }), (uri_1, _a) => __awaiter(this, [uri_1, _a], void 0, function* (uri, { id }) {
        const logs = yield apiClient.get(`/previews/${id}/logs`);
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
    }));
}
/**
 * Register repository-related resources
 */
function registerRepoResources(server, apiClient) {
    // List repositories resource
    server.resource("repositories", new mcp_js_1.ResourceTemplate("tugboat://repositories", { list: undefined }), (uri) => __awaiter(this, void 0, void 0, function* () {
        const repos = yield apiClient.get('/repos');
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
    }));
    // Single repository resource
    server.resource("repository", new mcp_js_1.ResourceTemplate("tugboat://repository/{id}", { list: undefined }), (uri_1, _a) => __awaiter(this, [uri_1, _a], void 0, function* (uri, { id }) {
        const repo = yield apiClient.get(`/repos/${id}`);
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
    }));
}
