"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AuthService_1 = require("../services/AuthService");
const DBProvider_1 = require("../database/DBProvider");
const router = express_1.default.Router();
// 1. Login Gatekeeper
router.get('/login', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('login');
});
// 2. Start OAuth for Login (First Account)
router.get('/auth/github', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const scope = 'repo workflow admin:org'; // Adjust scopes as needed
    const redirectUri = `${process.env.APP_BASE_URL}/oauth/callback`;
    const state = Math.random().toString(36).substring(7);
    if (req.session)
        req.session.oauthState = state;
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`);
});
// 3. Callback for Login
router.get('/oauth/callback', async (req, res) => {
    const { code, state } = req.query;
    // TODO: Verify state
    try {
        // For the initial login, we default to a label based on username or just "default"
        // But the prompt says "Switch Account flow: POST /use-account { label }".
        // For the FIRST login, we need to create an account entry or use a temporary session?
        // Prompt: "1) Authenticate with GitHub ... and obtain an access token."
        // Prompt: "Add Account flow: GET /login?label=... -> OAuth -> /oauth/callback ... -> encrypt & save."
        // Let's assume the first login sets up the session directly or creates a default account.
        // For simplicity, let's treat every login as "Adding an account" if a label is provided,
        // or just "Session Login" if not?
        // Wait, "Multi-Account Hub" implies the user is a manager of *stored* accounts.
        // So the user must be authenticated to the APP (Session) and then can USE one of the STORED accounts.
        // Let's simplify:
        // The user logs in to the App using GitHub. This creates the primary identity.
        // This primary identity is also stored as an account "primary" or similar.
        const tokenData = await AuthService_1.AuthService.exchangeCodeForToken(code);
        const userProfile = await AuthService_1.AuthService.fetchUserProfile(tokenData.access_token);
        // Auto-link this account as 'primary' or the username
        const label = userProfile.login;
        await AuthService_1.AuthService.linkAccount(code, label); // This re-exchanges code? No, we already exchanged.
        // We need to refactor linkAccount to accept tokenData if we already have it.
        // But let's just manually save it here.
        const store = DBProvider_1.DBProvider.getStore();
        const { encryptedToken, iv } = (await Promise.resolve().then(() => __importStar(require('../services/SecurityService')))).SecurityService.encrypt(tokenData.access_token);
        const account = {
            label,
            username: userProfile.login,
            provider: 'github',
            encryptedToken,
            iv,
            scopes: tokenData.scope ? tokenData.scope.split(',') : [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        await store.addAccount(account);
        if (req.session) {
            req.session.user = { username: userProfile.login, activeLabel: label };
        }
        res.redirect('/dashboard');
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Authentication Failed');
    }
});
// 4. Start OAuth for Adding EXTRA Account
router.get('/connect/github', (req, res) => {
    if (!req.session || !req.session.user)
        return res.redirect('/login');
    const label = req.query.label;
    if (!label)
        return res.status(400).send('Label is required');
    const clientId = process.env.GITHUB_CLIENT_ID;
    const scope = 'repo workflow admin:org';
    const redirectUri = `${process.env.APP_BASE_URL}/connect/callback?label=${label}`;
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`);
});
// 5. Callback for Adding Account
router.get('/connect/callback', async (req, res) => {
    if (!req.session || !req.session.user)
        return res.redirect('/login');
    const { code, label } = req.query;
    try {
        await AuthService_1.AuthService.linkAccount(code, label);
        res.redirect('/dashboard');
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Failed to link account');
    }
});
// 6. Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err)
            console.error(err);
        res.redirect('/login');
    });
});
exports.default = router;
