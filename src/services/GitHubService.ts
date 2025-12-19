import { Octokit } from 'octokit';

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  // Repository Operations
  async listRepos(page: number = 1, perPage: number = 100, type: 'all' | 'public' | 'private' | 'forks' = 'all') {
    // Note: GitHub API 'type' parameter for /user/repos is 'all', 'owner', 'public', 'private', 'member'.
    // 'forks' is not a valid 'type' directly, but we can filter 'all' or use 'type=all' and filter client side.
    // However, prompt asks for scalable fetching.
    // We will pass 'type' as is if valid, else map.
    const apiType = type === 'forks' ? 'all' : type;

    const response = await this.octokit.rest.repos.listForAuthenticatedUser({
      page,
      per_page: perPage,
      type: apiType as any,
      sort: 'updated',
    });

    let repos = response.data;
    if (type === 'forks') {
      repos = repos.filter((r: any) => r.fork);
    }
    return repos;
  }

  async createRepo(name: string, isPrivate: boolean, autoInit: boolean = true) {
    const response = await this.octokit.rest.repos.createForAuthenticatedUser({
      name,
      private: isPrivate,
      auto_init: autoInit,
    });
    return response.data;
  }

  async createFromTemplate(templateOwner: string, templateRepo: string, name: string, isPrivate: boolean) {
    const response = await this.octokit.rest.repos.createUsingTemplate({
      template_owner: templateOwner,
      template_repo: templateRepo,
      name,
      private: isPrivate,
    });
    return response.data;
  }

  async renameRepo(owner: string, repo: string, newName: string) {
    const response = await this.octokit.rest.repos.update({
      owner,
      repo,
      name: newName,
    });
    return response.data;
  }

  async toggleVisibility(owner: string, repo: string, isPrivate: boolean) {
    const response = await this.octokit.rest.repos.update({
      owner,
      repo,
      private: isPrivate,
    });
    return response.data;
  }

  async deleteRepo(owner: string, repo: string) {
    await this.octokit.rest.repos.delete({
      owner,
      repo,
    });
  }

  // Workflow Operations
  async listWorkflows(owner: string, repo: string) {
    const response = await this.octokit.rest.actions.listRepoWorkflows({
      owner,
      repo,
    });
    return response.data.workflows;
  }

  async dispatchWorkflow(owner: string, repo: string, workflowId: string | number, ref: string, inputs: any = {}) {
    await this.octokit.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflowId,
      ref,
      inputs,
    });
  }

  async listRuns(owner: string, repo: string) {
    const response = await this.octokit.rest.actions.listWorkflowRunsForRepo({
      owner,
      repo,
    });
    return response.data.workflow_runs;
  }

  async cancelRun(owner: string, repo: string, runId: number) {
    await this.octokit.rest.actions.cancelWorkflowRun({
      owner,
      repo,
      run_id: runId,
    });
  }

  // Governance / Permissions
  async getRepoPermissions(owner: string, repo: string) {
    // This requires the 'actions:read' or admin permissions
    const response = await this.octokit.rest.actions.getGithubActionsPermissionsRepository({
      owner,
      repo,
    });
    return response.data;
  }

  async setRepoPermissions(owner: string, repo: string, enabled: boolean, allowedActions?: 'all' | 'local_only' | 'selected') {
    await this.octokit.rest.actions.setGithubActionsPermissionsRepository({
      owner,
      repo,
      enabled,
      allowed_actions: allowedActions,
    });
  }
}
