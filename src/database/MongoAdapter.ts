import { IAccountsStore, IAccount } from './IAccountsStore';

export class MongoAdapter implements IAccountsStore {
  async addAccount(account: IAccount): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async getAccountByLabel(label: string): Promise<IAccount | null> {
    throw new Error('Method not implemented.');
  }
  async listAccounts(): Promise<IAccount[]> {
    throw new Error('Method not implemented.');
  }
  async removeAccount(label: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async updateAccount(label: string, updates: Partial<IAccount>): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
