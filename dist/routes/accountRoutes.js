"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const DBProvider_1 = require("../database/DBProvider");
const router = express_1.default.Router();
// LIST ACCOUNTS
router.get('/', async (req, res) => {
    try {
        const store = DBProvider_1.DBProvider.getStore();
        const accounts = await store.listAccounts();
        // Scrub sensitive data
        const safeAccounts = accounts.map(a => ({
            label: a.label,
            username: a.username,
            provider: a.provider,
            scopes: a.scopes,
            createdAt: a.createdAt,
            isActive: req.session?.user?.activeLabel === a.label
        }));
        res.json(safeAccounts);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// SWITCH ACCOUNT
router.post('/switch', async (req, res) => {
    try {
        const { label } = req.body;
        if (!label)
            return res.status(400).json({ error: 'Label required' });
        // Verify it exists
        const store = DBProvider_1.DBProvider.getStore();
        const account = await store.getAccountByLabel(label);
        if (!account)
            return res.status(404).json({ error: 'Account not found' });
        if (req.session && req.session.user) {
            req.session.user.activeLabel = label;
            // Also update username in session if we want UI to reflect the active user
            req.session.user.username = account.username;
        }
        res.json({ success: true, activeLabel: label });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
