import { IAccountsStore } from './IAccountsStore';
import { FirestoreAdapter } from './FirestoreAdapter';
// import { PostgresAdapter } from './PostgresAdapter'; // Stub
// import { MongoAdapter } from './MongoAdapter'; // Stub

export class DBProvider {
  private static instance: IAccountsStore;

  static getStore(): IAccountsStore {
    if (this.instance) return this.instance;

    const provider = process.env.DB_PROVIDER || 'firestore';

    switch (provider) {
      case 'firestore':
        this.instance = new FirestoreAdapter();
        break;
      case 'postgres':
        // this.instance = new PostgresAdapter();
        throw new Error('Postgres adapter not implemented yet');
      case 'mongo':
        // this.instance = new MongoAdapter();
        throw new Error('Mongo adapter not implemented yet');
      default:
        throw new Error(`Unknown DB_PROVIDER: ${provider}`);
    }

    return this.instance;
  }
}
