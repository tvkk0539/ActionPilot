import express from 'express';
import { DBProvider } from '../database/DBProvider';
import { SecurityService } from '../services/SecurityService';
import { GitHubService } from '../services/GitHubService';

const router = express.Router();

// Helper to get GitHubService for current session
async function getGithub(req: express.Request): Promise<GitHubService> {
  const label = req.session?.user?.activeLabel;
  if (!label) throw new Error('No active account selected');

  const store = DBProvider.getStore();
  const account = await store.getAccountByLabel(label);
  if (!account) throw new Error('Active account not found in store');

  const token = SecurityService.decrypt(account.encryptedToken, account.iv);
  return new GitHubService(token);
}

// LIST REPOS
router.get('/', async (req, res) => {
  try {
    const gh = await getGithub(req);
    const page = parseInt(req.query.page as string) || 1;
    const type = (req.query.type as any) || 'all';

    const repos = await gh.listRepos(page, 100, type);
    res.json(repos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE REPO
router.post('/', async (req, res) => {
  try {
    const gh = await getGithub(req);
    const { name, private: isPrivate, auto_init } = req.body;
    const repo = await gh.createRepo(name, isPrivate, auto_init);
    res.json(repo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GENERATE FROM TEMPLATE
router.post('/generate', async (req, res) => {
  try {
    const gh = await getGithub(req);
    const { template_owner, template_repo, name, private: isPrivate } = req.body;
    const repo = await gh.createFromTemplate(template_owner, template_repo, name, isPrivate);
    res.json(repo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH (Rename / Visibility)
router.patch('/:owner/:repo', async (req, res) => {
  try {
    const gh = await getGithub(req);
    const { owner, repo } = req.params;
    const { name: newName, private: isPrivate } = req.body;

    let result;
    if (newName) {
      result = await gh.renameRepo(owner, repo, newName);
    } else if (isPrivate !== undefined) {
      result = await gh.toggleVisibility(owner, repo, isPrivate);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE
router.delete('/:owner/:repo', async (req, res) => {
  try {
    const gh = await getGithub(req);
    const { owner, repo } = req.params;
    await gh.deleteRepo(owner, repo);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ACTIONS PERMISSIONS (Governance)
router.get('/:owner/:repo/actions/permissions', async (req, res) => {
  try {
    const gh = await getGithub(req);
    const { owner, repo } = req.params;
    const perms = await gh.getRepoPermissions(owner, repo);
    res.json(perms);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:owner/:repo/actions/permissions', async (req, res) => {
  try {
    const gh = await getGithub(req);
    const { owner, repo } = req.params;
    const { enabled, allowed_actions } = req.body;
    await gh.setRepoPermissions(owner, repo, enabled, allowed_actions);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
