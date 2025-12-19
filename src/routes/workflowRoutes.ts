import express from 'express';
import { DBProvider } from '../database/DBProvider';
import { SecurityService } from '../services/SecurityService';
import { GitHubService } from '../services/GitHubService';

const router = express.Router();

async function getGithub(req: express.Request): Promise<GitHubService> {
  const label = req.session?.user?.activeLabel;
  if (!label) throw new Error('No active account selected');

  const store = DBProvider.getStore();
  const account = await store.getAccountByLabel(label);
  if (!account) throw new Error('Active account not found in store');

  const token = SecurityService.decrypt(account.encryptedToken, account.iv);
  return new GitHubService(token);
}

// LIST WORKFLOWS
router.get('/:owner/:repo/workflows', async (req, res) => {
  try {
    const gh = await getGithub(req);
    const { owner, repo } = req.params;
    const workflows = await gh.listWorkflows(owner, repo);
    res.json(workflows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DISPATCH
router.post('/:owner/:repo/workflows/:id/dispatch', async (req, res) => {
  try {
    const gh = await getGithub(req);
    const { owner, repo, id } = req.params;
    const { ref, inputs } = req.body;
    await gh.dispatchWorkflow(owner, repo, id, ref || 'main', inputs);
    res.json({ success: true, message: 'Workflow triggered' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// LIST RUNS
router.get('/:owner/:repo/actions/runs', async (req, res) => {
  try {
    const gh = await getGithub(req);
    const { owner, repo } = req.params;
    const runs = await gh.listRuns(owner, repo);
    res.json(runs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CANCEL RUN
router.post('/:owner/:repo/actions/runs/:run_id/cancel', async (req, res) => {
  try {
    const gh = await getGithub(req);
    const { owner, repo, run_id } = req.params;
    await gh.cancelRun(owner, repo, parseInt(run_id));
    res.json({ success: true, message: 'Run cancelled' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
