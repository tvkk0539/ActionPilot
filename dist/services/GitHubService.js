"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubService = void 0;
const octokit_1 = require("octokit");
class GitHubService {
    constructor(token) {
        this.octokit = new octokit_1.Octokit({ auth: token });
    }
    // Repository Operations
    async listRepos(page = 1, perPage = 100, type = 'all') {
        // Note: GitHub API 'type' parameter for /user/repos is 'all', 'owner', 'public', 'private', 'member'.
        // 'forks' is not a valid 'type' directly, but we can filter 'all' or use 'type=all' and filter client side.
        // However, prompt asks for scalable fetching.
        // We will pass 'type' as is if valid, else map.
        const apiType = type === 'forks' ? 'all' : type;
        const response = await this.octokit.rest.repos.listForAuthenticatedUser({
            page,
            per_page: perPage,
            type: apiType,
            sort: 'updated',
        });
        let repos = response.data;
        if (type === 'forks') {
            repos = repos.filter((r) => r.fork);
        }
        return repos;
    }
    async createRepo(name, isPrivate, autoInit = true) {
        const response = await this.octokit.rest.repos.createForAuthenticatedUser({
            name,
            private: isPrivate,
            auto_init: autoInit,
        });
        return response.data;
    }
    async createFromTemplate(templateOwner, templateRepo, name, isPrivate) {
        const response = await this.octokit.rest.repos.createUsingTemplate({
            template_owner: templateOwner,
            template_repo: templateRepo,
            name,
            private: isPrivate,
        });
        return response.data;
    }
    async renameRepo(owner, repo, newName) {
        const response = await this.octokit.rest.repos.update({
            owner,
            repo,
            name: newName,
        });
        return response.data;
    }
    async toggleVisibility(owner, repo, isPrivate) {
        const response = await this.octokit.rest.repos.update({
            owner,
            repo,
            private: isPrivate,
        });
        return response.data;
    }
    async deleteRepo(owner, repo) {
        await this.octokit.rest.repos.delete({
            owner,
            repo,
        });
    }
    // Workflow Operations
    async listWorkflows(owner, repo) {
        const response = await this.octokit.rest.actions.listRepoWorkflows({
            owner,
            repo,
        });
        return response.data.workflows;
    }
    async dispatchWorkflow(owner, repo, workflowId, ref, inputs = {}) {
        await this.octokit.rest.actions.createWorkflowDispatch({
            owner,
            repo,
            workflow_id: workflowId,
            ref,
            inputs,
        });
    }
    async listRuns(owner, repo) {
        const response = await this.octokit.rest.actions.listWorkflowRunsForRepo({
            owner,
            repo,
        });
        return response.data.workflow_runs;
    }
    async cancelRun(owner, repo, runId) {
        await this.octokit.rest.actions.cancelWorkflowRun({
            owner,
            repo,
            run_id: runId,
        });
    }
    // Governance / Permissions
    async getRepoPermissions(owner, repo) {
        // This requires the 'actions:read' or admin permissions
        const response = await this.octokit.rest.actions.getGithubActionsPermissionsRepository({
            owner,
            repo,
        });
        return response.data;
    }
    async setRepoPermissions(owner, repo, enabled, allowedActions) {
        await this.octokit.rest.actions.setGithubActionsPermissionsRepository({
            owner,
            repo,
            enabled,
            allowed_actions: allowedActions,
        });
    }
}
exports.GitHubService = GitHubService;
