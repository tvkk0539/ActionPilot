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
exports.SecurityService = void 0;
const crypto = __importStar(require("crypto"));
class SecurityService {
    static getKey() {
        const keyString = process.env[this.KEY_ENV_VAR];
        if (!keyString) {
            throw new Error(`Environment variable ${this.KEY_ENV_VAR} is not set.`);
        }
        return Buffer.from(keyString, 'base64');
    }
    static encrypt(text) {
        const key = this.getKey();
        const iv = crypto.randomBytes(16); // IV length for AES-GCM is usually 12 bytes, but 16 is fine too. GCM standard recommends 12 (96 bits). Let's use 12 for standard compliance?
        // Wait, Node.js crypto documentation often uses 16 for CBC. GCM recommends 12. Let's stick to 12 bytes (96 bits) for GCM.
        const iv12 = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv12);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        // We store IV and AuthTag together or separately?
        // The prompt says "Store ciphertext + IV". It doesn't mention AuthTag, but GCM requires AuthTag to be secure.
        // I will append the AuthTag to the encrypted string or store it.
        // Let's store it as IV: <iv_hex>, encryptedToken: <encrypted_hex>:<authtag_hex> or similar?
        // Or just "encryptedToken" containing both.
        // The prompt says: "Store ciphertext + IV".
        // I'll assume `encryptedToken` = ciphertext + authtag (common practice is to append).
        // Let's stick to returning IV separately as requested, and append tag to ciphertext.
        return {
            encryptedToken: encrypted + ':' + authTag,
            iv: iv12.toString('hex')
        };
    }
    static decrypt(encryptedTokenWithTag, ivHex) {
        const key = this.getKey();
        const iv = Buffer.from(ivHex, 'hex');
        const parts = encryptedTokenWithTag.split(':');
        if (parts.length !== 2) {
            // Maybe it's just ciphertext? If so, GCM will fail without tag.
            throw new Error('Invalid encrypted token format. Expected ciphertext:authtag');
        }
        const ciphertext = parts[0];
        const authTag = Buffer.from(parts[1], 'hex');
        const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
exports.SecurityService = SecurityService;
SecurityService.ALGORITHM = 'aes-256-gcm';
SecurityService.KEY_ENV_VAR = 'DATA_ENCRYPTION_KEY'; // Base64 encoded 32-byte key
