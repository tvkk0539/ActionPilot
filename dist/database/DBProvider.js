"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBProvider = void 0;
const FirestoreAdapter_1 = require("./FirestoreAdapter");
// import { PostgresAdapter } from './PostgresAdapter'; // Stub
// import { MongoAdapter } from './MongoAdapter'; // Stub
class DBProvider {
    static getStore() {
        if (this.instance)
            return this.instance;
        const provider = process.env.DB_PROVIDER || 'firestore';
        switch (provider) {
            case 'firestore':
                this.instance = new FirestoreAdapter_1.FirestoreAdapter();
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
exports.DBProvider = DBProvider;
