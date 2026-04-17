/**
 * Credential Management API Routes
 * Phase 3: RESTful API for managing OAuth credentials
 */

import express from 'express';
import { CredentialManager } from '../core/credential-manager.js';

export function createCredentialsRouter(credentialManager) {
  const router = express.Router();

  // POST /api/orgs/:orgId/credentials - Create credential
  router.post('/orgs/:orgId/credentials', async (req, res) => {
    try {
      const { orgId } = req.params;
      const { provider, credentials } = req.body;

      if (!provider || !credentials) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['provider', 'credentials']
        });
      }

      const credentialId = `${orgId}:${provider}:${Date.now()}`;

      const storedCredential = {
        ...credentials,
        provider,
        orgId,
        createdAt: new Date().toISOString()
      };

      credentialManager.storeCredential(credentialId, storedCredential);

      res.status(201).json({
        id: credentialId,
        provider,
        orgId,
        createdAt: storedCredential.createdAt
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create credential',
        message: error.message
      });
    }
  });

  // GET /api/orgs/:orgId/credentials - List credentials
  router.get('/orgs/:orgId/credentials', async (req, res) => {
    try {
      const { orgId } = req.params;
      const allCredentials = credentialManager.listCredentials();

      const orgCredentials = allCredentials
        .filter(id => id.startsWith(`${orgId}:`))
        .map(id => {
          const cred = credentialManager.getCredential(id);
          return {
            id,
            provider: cred.provider,
            orgId: cred.orgId,
            createdAt: cred.createdAt,
            hasRefreshToken: !!cred.refresh_token
          };
        });

      res.json({
        credentials: orgCredentials,
        count: orgCredentials.length
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to list credentials',
        message: error.message
      });
    }
  });

  // GET /api/orgs/:orgId/credentials/:id - Get specific credential
  router.get('/orgs/:orgId/credentials/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const credential = credentialManager.getCredential(id);

      if (!credential) {
        return res.status(404).json({
          error: 'Credential not found'
        });
      }

      // Don't return sensitive tokens
      const sanitized = {
        id,
        provider: credential.provider,
        orgId: credential.orgId,
        createdAt: credential.createdAt,
        hasAccessToken: !!credential.access_token,
        hasRefreshToken: !!credential.refresh_token,
        expiresAt: credential.expires_at
      };

      res.json(sanitized);
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Credential not found'
        });
      }
      res.status(500).json({
        error: 'Failed to get credential',
        message: error.message
      });
    }
  });

  // PATCH /api/orgs/:orgId/credentials/:id - Refresh/update token
  router.patch('/orgs/:orgId/credentials/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { access_token, refresh_token, expires_at } = req.body;

      if (!access_token) {
        return res.status(400).json({
          error: 'Missing access_token'
        });
      }

      const updates = {
        access_token,
        updatedAt: new Date().toISOString()
      };

      if (refresh_token) updates.refresh_token = refresh_token;
      if (expires_at) updates.expires_at = expires_at;

      credentialManager.updateCredential(id, updates);

      res.json({
        id,
        updated: true,
        updatedAt: updates.updatedAt
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Credential not found'
        });
      }
      res.status(500).json({
        error: 'Failed to update credential',
        message: error.message
      });
    }
  });

  // DELETE /api/orgs/:orgId/credentials/:id - Remove credential
  router.delete('/orgs/:orgId/credentials/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = credentialManager.deleteCredential(id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Credential not found'
        });
      }

      res.json({
        id,
        deleted: true
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete credential',
        message: error.message
      });
    }
  });

  return router;
}
