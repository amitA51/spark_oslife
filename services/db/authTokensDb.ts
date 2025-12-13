/**
 * Auth Tokens Database Service
 * 
 * Manages encrypted OAuth token storage for external service authentication.
 * Tokens are encrypted before storage to protect against XSS attacks.
 */

import { LOCAL_STORAGE_KEYS as LS } from '../../constants';
import { dbGet, dbPut, dbDelete } from './indexedDBCore';
import {
    deriveKey,
    encryptString,
    decryptToString,
    generateSalt,
    ab2b64,
    b642ab,
} from '../cryptoService';

// --- Type Definitions ---

/**
 * OAuth token structure for external service authentication
 */
export interface OAuthToken {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
    expires_in?: number;
    token_type?: string;
    scope?: string;
}

/**
 * Stored auth token with service identifier
 */
export interface StoredAuthToken extends OAuthToken {
    service: string;
}

/**
 * Encrypted token storage structure
 */
interface EncryptedTokenData {
    service: string;
    encrypted: {
        salt: string;    // Base64 encoded salt
        iv: string;      // Base64 encoded IV
        data: string;    // Encrypted token data
    };
}

// Static encryption key component (combined with service name for unique key per service)
const TOKEN_ENCRYPTION_SALT = 'spark-token-encryption-v1';

// --- Token Operations ---

/**
 * Save an OAuth token with encryption.
 * SECURITY: Tokens are encrypted before storage to protect against XSS attacks.
 */
export const saveToken = async (service: string, token: OAuthToken): Promise<void> => {
    try {
        const salt = generateSalt();
        const key = await deriveKey(service + TOKEN_ENCRYPTION_SALT, salt, 10000);
        const encrypted = await encryptString(JSON.stringify(token), key);

        const encryptedData: EncryptedTokenData = {
            service,
            encrypted: {
                salt: ab2b64(salt),
                iv: encrypted.iv,
                data: encrypted.data,
            },
        };

        await dbPut(LS.AUTH_TOKENS, encryptedData);
    } catch (error) {
        console.error('Failed to encrypt and save token:', error);
        throw new Error('Failed to save authentication token securely');
    }
};

/**
 * Get and decrypt an OAuth token.
 * SECURITY: Tokens are decrypted on retrieval.
 */
export const getToken = async (service: string): Promise<StoredAuthToken | null> => {
    try {
        const stored = await dbGet<EncryptedTokenData>(LS.AUTH_TOKENS, service);

        if (!stored?.encrypted) {
            return null;
        }

        const salt = b642ab(stored.encrypted.salt);
        const key = await deriveKey(service + TOKEN_ENCRYPTION_SALT, salt, 10000);
        const decrypted = await decryptToString(stored.encrypted.data, stored.encrypted.iv, key);
        const token = JSON.parse(decrypted) as OAuthToken;

        return { service, ...token };
    } catch (error) {
        console.error('Failed to decrypt token:', error);
        // Token may be corrupted or tampered with - remove it
        await removeToken(service);
        return null;
    }
};

/**
 * Remove a token from storage.
 */
export const removeToken = (service: string): Promise<void> => dbDelete(LS.AUTH_TOKENS, service);
