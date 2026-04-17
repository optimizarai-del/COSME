/**
 * CredentialManager - Secure credential storage and injection
 * Phase 2: Credential management for OAuth tokens
 */

import crypto from 'crypto';

export class CredentialManager {
  constructor(options = {}) {
    this.credentials = new Map();
    this.encryptionKey = options.encryptionKey || this._generateKey();
    this.algorithm = 'aes-256-gcm';
  }

  _generateKey() {
    return crypto.randomBytes(32);
  }

  encrypt(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  storeCredential(id, credential) {
    const encrypted = this.encrypt(credential);
    this.credentials.set(id, {
      id,
      encrypted,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return id;
  }

  getCredential(id) {
    const stored = this.credentials.get(id);
    if (!stored) {
      throw new Error(`Credential not found: ${id}`);
    }
    return this.decrypt(stored.encrypted);
  }

  updateCredential(id, updates) {
    const existing = this.getCredential(id);
    const updated = { ...existing, ...updates };
    const encrypted = this.encrypt(updated);

    this.credentials.set(id, {
      id,
      encrypted,
      createdAt: this.credentials.get(id).createdAt,
      updatedAt: new Date()
    });

    return id;
  }

  deleteCredential(id) {
    return this.credentials.delete(id);
  }

  listCredentials() {
    return Array.from(this.credentials.keys());
  }

  refreshToken(id, newTokens) {
    return this.updateCredential(id, {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || this.getCredential(id).refresh_token,
      expires_at: newTokens.expires_at
    });
  }
}
