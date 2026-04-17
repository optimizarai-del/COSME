import test from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { CredentialManager } from './credential-manager.js';

test('CredentialManager - Store and Retrieve', async (t) => {
  const manager = new CredentialManager();
  const credential = {
    access_token: 'test-token',
    refresh_token: 'refresh-token',
    expires_at: Date.now() + 3600000
  };

  const id = manager.storeCredential('cred1', credential);
  const retrieved = manager.getCredential(id);

  assert.deepStrictEqual(retrieved, credential);
});

test('CredentialManager - Encryption Security', async (t) => {
  const key = crypto.randomBytes(32);
  const manager = new CredentialManager({ encryptionKey: key });
  const credential = { secret: 'sensitive-data' };

  const id = manager.storeCredential('secret', credential);
  const stored = manager.credentials.get(id);

  // Verify data is encrypted
  assert(stored.encrypted.encrypted);
  assert.notStrictEqual(stored.encrypted.encrypted, JSON.stringify(credential));
});

test('CredentialManager - Wrong Key Decryption Fails', async (t) => {
  const key1 = crypto.randomBytes(32);
  const key2 = crypto.randomBytes(32);

  const manager1 = new CredentialManager({ encryptionKey: key1 });
  const credential = { token: 'secret' };
  const id = manager1.storeCredential('test', credential);
  const encrypted = manager1.credentials.get(id).encrypted;

  const manager2 = new CredentialManager({ encryptionKey: key2 });
  manager2.credentials.set(id, { id, encrypted });

  try {
    manager2.getCredential(id);
    assert.fail('Should have thrown an error');
  } catch (err) {
    // Expected error from decryption failure
    assert(err instanceof Error);
  }
});

test('CredentialManager - Update Credential', async (t) => {
  const manager = new CredentialManager();
  const initial = { access_token: 'old', refresh_token: 'refresh' };

  const id = manager.storeCredential('test', initial);
  manager.updateCredential(id, { access_token: 'new' });

  const updated = manager.getCredential(id);
  assert.strictEqual(updated.access_token, 'new');
  assert.strictEqual(updated.refresh_token, 'refresh');
});

test('CredentialManager - Delete Credential', async (t) => {
  const manager = new CredentialManager();
  manager.storeCredential('test', { token: 'value' });

  const deleted = manager.deleteCredential('test');
  assert(deleted);

  try {
    manager.getCredential('test');
    assert.fail('Should have thrown an error');
  } catch (err) {
    assert(err.message.includes('not found'));
  }
});

test('CredentialManager - List Credentials', async (t) => {
  const manager = new CredentialManager();
  manager.storeCredential('cred1', { token: 'a' });
  manager.storeCredential('cred2', { token: 'b' });
  manager.storeCredential('cred3', { token: 'c' });

  const list = manager.listCredentials().sort();
  assert.deepStrictEqual(list, ['cred1', 'cred2', 'cred3']);
});

test('CredentialManager - Refresh Token', async (t) => {
  const manager = new CredentialManager();
  const initial = {
    access_token: 'old-access',
    refresh_token: 'refresh',
    expires_at: Date.now()
  };

  const id = manager.storeCredential('test', initial);
  const expiresAt = Date.now() + 7200000;

  manager.refreshToken(id, {
    access_token: 'new-access',
    expires_at: expiresAt
  });

  const refreshed = manager.getCredential(id);
  assert.strictEqual(refreshed.access_token, 'new-access');
  assert.strictEqual(refreshed.refresh_token, 'refresh');
  assert.strictEqual(refreshed.expires_at, expiresAt);
});

test('CredentialManager - Metadata Tracking', async (t) => {
  const manager = new CredentialManager();
  manager.storeCredential('test', { token: 'value' });
  const stored = manager.credentials.get('test');

  assert(stored.createdAt instanceof Date);
  assert(stored.updatedAt instanceof Date);

  manager.updateCredential('test', { token: 'new' });
  const updated = manager.credentials.get('test');

  assert(updated.updatedAt >= stored.updatedAt);
});

test('CredentialManager - Get Non-existent Credential', async (t) => {
  const manager = new CredentialManager();

  try {
    manager.getCredential('nonexistent');
    assert.fail('Should have thrown an error');
  } catch (err) {
    assert(err.message.includes('not found'));
  }
});

test('CredentialManager - Encrypt/Decrypt Roundtrip', async (t) => {
  const manager = new CredentialManager();
  const original = {
    access_token: 'token123',
    refresh_token: 'refresh456',
    expires_at: 1704067200000,
    extra: { nested: 'data' }
  };

  const encrypted = manager.encrypt(original);
  const decrypted = manager.decrypt(encrypted);

  assert.deepStrictEqual(decrypted, original);
});
