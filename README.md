# COSME - Dynamic Tool Executor Engine

A flexible, dynamic tool execution engine for AI agents with Claude function calling and Google Sheets integration.

## Features

### Phase 1: Claude Function Calling (✅ Complete)
- Claude API integration with tool use support
- Automatic function calling loop
- Multi-turn conversation handling
- Tool result processing
- Error handling and retry logic

### Phase 2: Google Sheets Integration (✅ Complete)
- Create spreadsheets with multiple sheets
- Append rows to existing sheets
- Read ranges from spreadsheets
- OAuth token management with auto-refresh
- AES-256 encrypted credential storage

### Phase 3: Credential Management API (✅ Complete)
- RESTful API for credential CRUD operations
- POST /api/orgs/:orgId/credentials - Create
- GET /api/orgs/:orgId/credentials - List
- PATCH /api/orgs/:orgId/credentials/:id - Update/refresh
- DELETE /api/orgs/:orgId/credentials/:id - Delete
- Secure credential storage with encryption

### Phase 4: Multi-Provider OAuth Flows (✅ Complete)
- **HubSpot** - Full OAuth2 flow with token refresh
- **Meta** (Facebook/Instagram) - OAuth with long-lived tokens
- **Stripe** - Connect OAuth with permanent tokens
- **Generic** - Configurable OAuth2 for any provider
- Support for API keys and webhooks
- Automatic token refresh handling
- Complete callback and state management

### Core Features
- Dynamic tool loading and execution
- Tool schema validation
- Execution monitoring and logging
- Retry strategies with exponential backoff
- Full Express API server

## Architecture

```
cosme/
├── src/
│   ├── core/
│   │   ├── executor.js           # Basic tool executor
│   │   ├── claude-executor.js    # Claude API function calling (Phase 1)
│   │   ├── registry.js           # Tool registration
│   │   ├── context.js            # Execution context
│   │   └── credential-manager.js # Encrypted credential storage (Phase 2/3)
│   ├── tools/
│   │   ├── loader.js             # Dynamic tool loader
│   │   └── google-sheets.js      # Google Sheets integration (Phase 2)
│   ├── api/
│   │   ├── credentials-routes.js # Credential management API (Phase 3)
│   │   └── oauth-routes.js       # OAuth flow routes (Phase 4)
│   ├── oauth/
│   │   ├── oauth-manager.js      # Provider management (Phase 4)
│   │   └── providers/
│   │       ├── hubspot.js        # HubSpot OAuth (Phase 4)
│   │       ├── meta.js           # Meta/Instagram OAuth (Phase 4)
│   │       ├── stripe.js         # Stripe OAuth (Phase 4)
│   │       └── generic.js        # Generic OAuth provider (Phase 4)
│   ├── executors/
│   │   └── strategy.js           # Execution strategies
│   ├── utils/
│   │   └── logger.js             # Logging utility
│   ├── server.js                 # Express API server (Phase 3/4)
│   └── index.js                  # Main exports
├── config/                       # Configuration files
├── examples/
│   ├── basic-usage.js
│   ├── claude-sheets-example.js  # Phase 1 + 2 demo
│   └── full-server-example.js    # All phases integrated
└── .env.example                  # Environment variables template
```

## Installation

```bash
npm install
```

## Usage

### Basic Tool Execution

```javascript
import { ToolExecutor } from './src/index.js';

const executor = new ToolExecutor();
executor.registerTool('greet', {
  execute: async (params) => `Hello, ${params.name}!`
});

await executor.execute('greet', { name: 'World' });
```

### Claude Function Calling with Google Sheets

```javascript
import { ClaudeExecutor } from './src/index.js';
import { GoogleSheetsTools } from './src/index.js';
import { CredentialManager } from './src/index.js';

// Setup credentials
const credManager = new CredentialManager();
const credId = credManager.storeCredential('google', {
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  access_token: process.env.GOOGLE_ACCESS_TOKEN,
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

// Initialize Google Sheets tools
const creds = credManager.getCredential(credId);
const sheetsTools = new GoogleSheetsTools(creds);

// Setup Claude executor
const executor = new ClaudeExecutor({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Register tools
for (const tool of sheetsTools.getAllTools()) {
  executor.registerTool(tool.name, tool);
}

// Execute with Claude
const result = await executor.executeWithClaude(
  'Create a spreadsheet called "Sales Data" and add some sample data'
);
```

See `examples/claude-sheets-example.js` for a complete example.

### Complete API Server (Phases 3 & 4)

```javascript
import { createServer } from './src/server.js';

const server = createServer({
  encryptionKey: Buffer.from(process.env.ENCRYPTION_KEY, 'hex'),
  providers: {
    hubspot: {
      clientId: process.env.HUBSPOT_CLIENT_ID,
      clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
      redirectUri: 'http://localhost:3000/api/oauth/hubspot/callback'
    },
    meta: {
      clientId: process.env.META_CLIENT_ID,
      clientSecret: process.env.META_CLIENT_SECRET,
      redirectUri: 'http://localhost:3000/api/oauth/meta/callback'
    },
    stripe: {
      clientId: process.env.STRIPE_CLIENT_ID,
      clientSecret: process.env.STRIPE_SECRET_KEY,
      redirectUri: 'http://localhost:3000/api/oauth/stripe/callback'
    }
  }
});

await server.start(3000);
```

See `examples/full-server-example.js` for the complete server setup.

## API Endpoints

### Credential Management (Phase 3)

- `POST /api/orgs/:orgId/credentials` - Create credential
- `GET /api/orgs/:orgId/credentials` - List credentials
- `GET /api/orgs/:orgId/credentials/:id` - Get credential
- `PATCH /api/orgs/:orgId/credentials/:id` - Update/refresh token
- `DELETE /api/orgs/:orgId/credentials/:id` - Delete credential

### OAuth Flows (Phase 4)

- `GET /api/oauth/providers` - List available OAuth providers
- `GET /api/oauth/:provider/authorize` - Start OAuth flow
- `GET /api/oauth/:provider/callback` - OAuth callback handler
- `POST /api/oauth/:provider/refresh` - Refresh access token
- `POST /api/oauth/:provider/revoke` - Revoke access

### Supported OAuth Providers

- **HubSpot** - CRM and marketing automation
- **Meta** - Facebook and Instagram
- **Stripe** - Payment processing
- **Generic** - Any OAuth2-compatible service

## Development

```bash
npm test
npm run lint
```

## License

MIT
