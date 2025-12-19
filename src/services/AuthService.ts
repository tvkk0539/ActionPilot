import axios from 'axios';
import { SecurityService } from './SecurityService';
import { DBProvider } from '../database/DBProvider';

export class AuthService {
  private static readonly CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  private static readonly CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

  static async exchangeCodeForToken(code: string): Promise<any> {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      throw new Error('GitHub Client ID or Secret is missing in env');
    }

    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    if (response.data.error) {
      throw new Error(`GitHub OAuth Error: ${response.data.error_description}`);
    }

    return response.data; // contains access_token, scope, token_type
  }

  static async fetchUserProfile(accessToken: string): Promise<any> {
    const response = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  static async linkAccount(code: string, label: string) {
    // 1. Exchange code
    const tokenData = await this.exchangeCodeForToken(code);
    const accessToken = tokenData.access_token;

    // 2. Get User Profile
    const userProfile = await this.fetchUserProfile(accessToken);
    const username = userProfile.login;

    // 3. Encrypt Token
    const { encryptedToken, iv } = SecurityService.encrypt(accessToken);

    // 4. Save to Store
    const store = DBProvider.getStore();

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
    } else {
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
