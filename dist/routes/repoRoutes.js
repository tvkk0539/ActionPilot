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
// Helper to get GitHubService for current session
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
// LIST REPOS
router.get('/', async (req, res) => {
    try {
        const gh = await getGithub(req);
        const page = parseInt(req.query.page) || 1;
        const type = req.query.type || 'all';
        const repos = await gh.listRepos(page, 100, type);
        res.json(repos);
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
        }
        else if (isPrivate !== undefined) {
            result = await gh.toggleVisibility(owner, repo, isPrivate);
        }
        res.json(result);
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
