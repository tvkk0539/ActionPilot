export interface IAccount {
  label: string;
  username: string;
  provider: 'github';
  encryptedToken: string;
  iv: string;
  scopes: string[];
  createdAt: number;
  updatedAt: number;
}

export interface IAccountsStore {
  addAccount(account: IAccount): Promise<void>;
  getAccountByLabel(label: string): Promise<IAccount | null>;
  listAccounts(): Promise<IAccount[]>;
  removeAccount(label: string): Promise<void>;
  updateAccount(label: string, updates: Partial<IAccount>): Promise<void>;
}
