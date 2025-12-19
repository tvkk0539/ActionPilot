import * as admin from 'firebase-admin';
import { IAccountsStore, IAccount } from './IAccountsStore';

export class FirestoreAdapter implements IAccountsStore {
  private db: admin.firestore.Firestore;
  private collectionName = 'accounts';

  constructor() {
    // Initialize Firebase Admin if not already initialized
    if (admin.apps.length === 0) {
      admin.initializeApp();
    }
    this.db = admin.firestore();
  }

  async addAccount(account: IAccount): Promise<void> {
    await this.db.collection(this.collectionName).doc(account.label).set(account);
  }

  async getAccountByLabel(label: string): Promise<IAccount | null> {
    const doc = await this.db.collection(this.collectionName).doc(label).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as IAccount;
  }

  async listAccounts(): Promise<IAccount[]> {
    const snapshot = await this.db.collection(this.collectionName).get();
    return snapshot.docs.map(doc => doc.data() as IAccount);
  }

  async removeAccount(label: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(label).delete();
  }

  async updateAccount(label: string, updates: Partial<IAccount>): Promise<void> {
    await this.db.collection(this.collectionName).doc(label).update(updates);
  }
}
