"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const axios_1 = __importDefault(require("axios"));
const SecurityService_1 = require("./SecurityService");
const DBProvider_1 = require("../database/DBProvider");
class AuthService {
    static async exchangeCodeForToken(code) {
        if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
            throw new Error('GitHub Client ID or Secret is missing in env');
        }
        const response = await axios_1.default.post('https://github.com/login/oauth/access_token', {
            client_id: this.CLIENT_ID,
            client_secret: this.CLIENT_SECRET,
            code,
        }, {
            headers: { Accept: 'application/json' },
        });
        if (response.data.error) {
            throw new Error(`GitHub OAuth Error: ${response.data.error_description}`);
        }
        return response.data; // contains access_token, scope, token_type
    }
    static async fetchUserProfile(accessToken) {
        const response = await axios_1.default.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
    }
    static async linkAccount(code, label) {
        // 1. Exchange code
        const tokenData = await this.exchangeCodeForToken(code);
        const accessToken = tokenData.access_token;
        // 2. Get User Profile
        const userProfile = await this.fetchUserProfile(accessToken);
        const username = userProfile.login;
        // 3. Encrypt Token
        const { encryptedToken, iv } = SecurityService_1.SecurityService.encrypt(accessToken);
        // 4. Save to Store
        const store = DBProvider_1.DBProvider.getStore();
        // Check if label exists, if so throw error or overwrite?
        // Prompt implies unique label.
        const existing = await store.getAccountByLabel(label);
        if (existing) {
            // update
            await store.updateAccount(label, {
                username,
                encryptedToken,
                iv,
                scopes: tokenData.scope ? tokenData.scope.split(',') : [],
                updatedAt: Date.now()
            });
        }
        else {
            await store.addAccount({
                label,
                username,
                provider: 'github',
                encryptedToken,
                iv,
                scopes: tokenData.scope ? tokenData.scope.split(',') : [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }
        return { label, username };
    }
}
exports.AuthService = AuthService;
AuthService.CLIENT_ID = process.env.GITHUB_CLIENT_ID;
AuthService.CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
