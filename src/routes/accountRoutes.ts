import express from 'express';
import { DBProvider } from '../database/DBProvider';

const router = express.Router();

// LIST ACCOUNTS
router.get('/', async (req, res) => {
  try {
    const store = DBProvider.getStore();
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SWITCH ACCOUNT
router.post('/switch', async (req, res) => {
  try {
    const { label } = req.body;
    if (!label) return res.status(400).json({ error: 'Label required' });

    // Verify it exists
    const store = DBProvider.getStore();
    const account = await store.getAccountByLabel(label);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    if (req.session && req.session.user) {
      req.session.user.activeLabel = label;
      // Also update username in session if we want UI to reflect the active user
      req.session.user.username = account.username;
    }

    res.json({ success: true, activeLabel: label });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
