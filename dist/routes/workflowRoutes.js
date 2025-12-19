"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const DBProvider_1 = require("../database/DBProvider");
const SecurityService_1 = require("../services/SecurityService");
const GitHubService_1 = require("../services/GitHubService");
const router = express_1.default.Router();
async function getGithub(req) {
    const label = req.session?.user?.activeLabel;
    if (!label)
        throw new Error('No active account selected');
    const store = DBProvider_1.DBProvider.getStore();
    const account = await store.getAccountByLabel(label);
    if (!account)
        throw new Error('Active account not found in store');
    const token = SecurityService_1.SecurityService.decrypt(account.encryptedToken, account.iv);
    return new GitHubService_1.GitHubService(token);
}
// LIST WORKFLOWS
router.get('/:owner/:repo/workflows', async (req, res) => {
    try {
        const gh = await getGithub(req);
        const { owner, repo } = req.params;
        const workflows = await gh.listWorkflows(owner, repo);
        res.json(workflows);
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
