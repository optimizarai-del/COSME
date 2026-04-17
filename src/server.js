/**
 * Express Server
 * Complete API server with Phase 3 & 4 implementations
 */

import express from 'express';
import { CredentialManager } from './core/credential-manager.js';
import { OAuthManager } from './oauth/oauth-manager.js';
import { createCredentialsRouter } from './api/credentials-routes.js';
import { createOAuthRouter } from './api/oauth-routes.js';

export function createServer(options = {}) {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static('public'));

  // CORS (configure as needed)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

  // Initialize managers
  const credentialManager = new CredentialManager({
    encryptionKey: options.encryptionKey
  });

  const oauthManager = new OAuthManager();

  // Register OAuth providers from config
  if (options.providers) {
    if (options.providers.hubspot) {
      oauthManager.registerHubSpot(options.providers.hubspot);
    }
    if (options.providers.meta) {
      oauthManager.registerMeta(options.providers.meta);
    }
    if (options.providers.stripe) {
      oauthManager.registerStripe(options.providers.stripe);
    }
    if (options.providers.generic) {
      for (const [name, config] of Object.entries(options.providers.generic)) {
        oauthManager.registerGeneric(name, config);
      }
    }
  }

  // Mount routes
  app.use('/api', createCredentialsRouter(credentialManager));
  app.use('/api/oauth', createOAuthRouter(oauthManager, credentialManager));

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      providers: oauthManager.listProviders(),
      timestamp: new Date().toISOString()
    });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  });

  return {
    app,
    credentialManager,
    oauthManager,
    start: (port = 3000) => {
      return new Promise((resolve) => {
        const server = app.listen(port, () => {
          console.log(`COSME API server running on port ${port}`);
          resolve(server);
        });
      });
    }
  };
}
