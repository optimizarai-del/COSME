/**
 * COSME - Dynamic Tool Executor Engine
 * Main entry point
 */

// Phase 1: Claude Function Calling
export { ToolExecutor } from './core/executor.js';
export { ClaudeExecutor } from './core/claude-executor.js';
export { ToolRegistry } from './core/registry.js';
export { ToolLoader } from './tools/loader.js';
export { ExecutionStrategy } from './executors/strategy.js';

// Phase 2: Google Sheets Integration
export { CredentialManager } from './core/credential-manager.js';
export { GoogleSheetsTools } from './tools/google-sheets.js';

// Phase 3: Credential Management API
export { createCredentialsRouter } from './api/credentials-routes.js';

// Phase 4: Multi-Provider OAuth
export { OAuthManager } from './oauth/oauth-manager.js';
export { HubSpotOAuthProvider } from './oauth/providers/hubspot.js';
export { MetaOAuthProvider } from './oauth/providers/meta.js';
export { StripeOAuthProvider } from './oauth/providers/stripe.js';
export { GenericOAuthProvider } from './oauth/providers/generic.js';
export { createOAuthRouter } from './api/oauth-routes.js';

// Complete Server
export { createServer } from './server.js';
