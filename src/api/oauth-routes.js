/**
 * OAuth Routes
 * Phase 4: API routes for OAuth flows
 */

import express from 'express';

export function createOAuthRouter(oauthManager, credentialManager) {
  const router = express.Router();

  // GET /api/oauth/providers - List available providers
  router.get('/providers', (req, res) => {
    try {
      const providers = oauthManager.getAllProvidersInfo();
      res.json({ providers });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to list providers',
        message: error.message
      });
    }
  });

  // GET /api/oauth/:provider/authorize - Start OAuth flow
  router.get('/:provider/authorize', (req, res) => {
    try {
      const { provider } = req.params;
      const { orgId, state, redirectUri } = req.query;

      if (!orgId) {
        return res.status(400).json({
          error: 'Missing orgId parameter'
        });
      }

      const oauthProvider = oauthManager.getProvider(provider);
      const authUrl = oauthProvider.getAuthorizationUrl(state);

      // Store state for callback validation
      const stateData = {
        provider,
        orgId,
        createdAt: Date.now(),
        redirectUri: redirectUri || `${req.protocol}://${req.get('host')}/`
      };

      // In production, store this in Redis or database
      global.oauthStates = global.oauthStates || new Map();
      global.oauthStates.set(state || 'default', stateData);

      // Redirect browser to provider's authorization URL
      res.redirect(authUrl);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to start OAuth flow',
        message: error.message
      });
    }
  });

  // GET /api/oauth/:provider/callback - OAuth callback handler
  router.get('/:provider/callback', async (req, res) => {
    try {
      const { provider } = req.params;
      const { code, state, error, error_description } = req.query;

      if (error) {
        return res.status(400).json({
          error: 'OAuth authorization failed',
          details: error_description || error
        });
      }

      if (!code) {
        return res.status(400).json({
          error: 'Missing authorization code'
        });
      }

      // Validate state
      global.oauthStates = global.oauthStates || new Map();
      const stateData = global.oauthStates.get(state);

      if (!stateData) {
        return res.status(400).json({
          error: 'Invalid or expired state parameter'
        });
      }

      // Exchange code for tokens
      const oauthProvider = oauthManager.getProvider(provider);
      const tokens = await oauthProvider.exchangeCodeForToken(code);

      // Store credentials
      const credentialId = `${stateData.orgId}:${provider}:${Date.now()}`;
      const credential = {
        ...tokens,
        provider,
        orgId: stateData.orgId,
        createdAt: new Date().toISOString()
      };

      credentialManager.storeCredential(credentialId, credential);

      // Cleanup state
      global.oauthStates.delete(state);

      // Redirect back to frontend with success
      const redirectUri = stateData.redirectUri || `${req.protocol}://${req.get('host')}/`;
      const successUrl = new URL(redirectUri);
      successUrl.searchParams.set('oauth_success', 'true');
      successUrl.searchParams.set('provider', provider);
      successUrl.searchParams.set('state', state);
      successUrl.searchParams.set('credentialId', credentialId);

      res.redirect(successUrl.toString());
    } catch (error) {
      res.status(500).json({
        error: 'OAuth callback failed',
        message: error.message
      });
    }
  });

  // POST /api/oauth/:provider/refresh - Refresh access token
  router.post('/:provider/refresh', async (req, res) => {
    try {
      const { provider } = req.params;
      const { credentialId } = req.body;

      if (!credentialId) {
        return res.status(400).json({
          error: 'Missing credentialId'
        });
      }

      const credential = credentialManager.getCredential(credentialId);
      const oauthProvider = oauthManager.getProvider(provider);

      const newTokens = await oauthProvider.refreshAccessToken(
        credential.refresh_token || credential.access_token
      );

      // Update stored credentials
      credentialManager.updateCredential(credentialId, newTokens);

      res.json({
        success: true,
        credentialId,
        expiresAt: newTokens.expires_at
      });
    } catch (error) {
      res.status(500).json({
        error: 'Token refresh failed',
        message: error.message
      });
    }
  });

  // POST /api/oauth/:provider/revoke - Revoke access
  router.post('/:provider/revoke', async (req, res) => {
    try {
      const { provider } = req.params;
      const { credentialId } = req.body;

      if (!credentialId) {
        return res.status(400).json({
          error: 'Missing credentialId'
        });
      }

      const credential = credentialManager.getCredential(credentialId);
      const oauthProvider = oauthManager.getProvider(provider);

      const result = await oauthProvider.revokeToken(
        credential.stripe_user_id || credential.access_token
      );

      if (result.revoked) {
        credentialManager.deleteCredential(credentialId);
      }

      res.json({
        success: result.revoked,
        credentialId
      });
    } catch (error) {
      res.status(500).json({
        error: 'Token revocation failed',
        message: error.message
      });
    }
  });

  return router;
}
