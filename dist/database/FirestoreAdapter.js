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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreAdapter = void 0;
const admin = __importStar(require("firebase-admin"));
class FirestoreAdapter {
    constructor() {
        this.collectionName = 'accounts';
        // Initialize Firebase Admin if not already initialized
        if (admin.apps.length === 0) {
            admin.initializeApp();
        }
        this.db = admin.firestore();
    }
    async addAccount(account) {
        await this.db.collection(this.collectionName).doc(account.label).set(account);
    }
    async getAccountByLabel(label) {
        const doc = await this.db.collection(this.collectionName).doc(label).get();
        if (!doc.exists) {
            return null;
        }
        return doc.data();
    }
    async listAccounts() {
        const snapshot = await this.db.collection(this.collectionName).get();
        return snapshot.docs.map(doc => doc.data());
    }
    async removeAccount(label) {
        await this.db.collection(this.collectionName).doc(label).delete();
    }
    async updateAccount(label, updates) {
        await this.db.collection(this.collectionName).doc(label).update(updates);
    }
}
exports.FirestoreAdapter = FirestoreAdapter;
