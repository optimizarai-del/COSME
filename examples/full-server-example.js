/**
 * Complete Server Example
 * All 4 phases integrated: Claude + Google Sheets + Credentials API + OAuth
 */

import { createServer } from '../src/server.js';
import crypto from 'crypto';

// Server configuration
const config = {
  encryptionKey: process.env.ENCRYPTION_KEY
    ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
    : crypto.randomBytes(32),

  providers: {
    // HubSpot OAuth
    hubspot: {
      clientId: process.env.HUBSPOT_CLIENT_ID,
      clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
      redirectUri: process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:3000/api/oauth/hubspot/callback',
      scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write']
    },

    // Meta (Facebook/Instagram) OAuth
    meta: {
      clientId: process.env.META_CLIENT_ID,
      clientSecret: process.env.META_CLIENT_SECRET,
      redirectUri: process.env.META_REDIRECT_URI || 'http://localhost:3000/api/oauth/meta/callback',
      scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list']
    },

    // Stripe OAuth
    stripe: {
      clientId: process.env.STRIPE_CLIENT_ID,
      clientSecret: process.env.STRIPE_SECRET_KEY,
      redirectUri: process.env.STRIPE_REDIRECT_URI || 'http://localhost:3000/api/oauth/stripe/callback'
    },

    // Generic providers (custom OAuth services)
    generic: {
      // Example: Shopify
      shopify: {
        name: 'Shopify',
        clientId: process.env.SHOPIFY_CLIENT_ID,
        clientSecret: process.env.SHOPIFY_CLIENT_SECRET,
        redirectUri: process.env.SHOPIFY_REDIRECT_URI,
        authorizationUrl: `https://${process.env.SHOPIFY_SHOP_DOMAIN}/admin/oauth/authorize`,
        tokenUrl: `https://${process.env.SHOPIFY_SHOP_DOMAIN}/admin/oauth/access_token`,
        scopes: ['read_products', 'write_products']
      }
    }
  }
};

// Create and start server
async function main() {
  const { app, start } = createServer(config);

  const port = process.env.PORT || 3000;
  await start(port);

  console.log(`
╔═══════════════════════════════════════════════════╗
║   COSME - Dynamic Tool Executor Engine            ║
║   All Phases Active                               ║
╚═══════════════════════════════════════════════════╝

Server running on: http://localhost:${port}

Available Endpoints:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Health Check:
  GET  /health

Credential Management (Phase 3):
  POST   /api/orgs/:orgId/credentials
  GET    /api/orgs/:orgId/credentials
  GET    /api/orgs/:orgId/credentials/:id
  PATCH  /api/orgs/:orgId/credentials/:id
  DELETE /api/orgs/:orgId/credentials/:id

OAuth Flows (Phase 4):
  GET  /api/oauth/providers
  GET  /api/oauth/:provider/authorize
  GET  /api/oauth/:provider/callback
  POST /api/oauth/:provider/refresh
  POST /api/oauth/:provider/revoke

Supported OAuth Providers:
  - HubSpot
  - Meta (Facebook/Instagram)
  - Stripe
  - Generic (Custom)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

main().catch(console.error);
