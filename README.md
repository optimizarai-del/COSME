# COSME - Dynamic Tool Executor Engine

A flexible, dynamic tool execution engine for AI agents with Claude function calling and multi-provider OAuth.

## Features

- **Phase 1**: Claude API integration with function calling
- **Phase 2**: Google Sheets integration with OAuth token management
- **Phase 3**: RESTful Credential Management API
- **Phase 4**: Multi-provider OAuth (HubSpot, Meta, Stripe, Generic)

## Installation

```bash
npm install
npm test
npm start
```

## API Endpoints

### Credential Management
- `POST /api/orgs/:orgId/credentials`
- `GET /api/orgs/:orgId/credentials`
- `GET /api/orgs/:orgId/credentials/:id`
- `PATCH /api/orgs/:orgId/credentials/:id`
- `DELETE /api/orgs/:orgId/credentials/:id`

### OAuth Flows
- `GET /api/oauth/providers`
- `GET /api/oauth/:provider/authorize`
- `GET /api/oauth/:provider/callback`
- `POST /api/oauth/:provider/refresh`
- `POST /api/oauth/:provider/revoke`

## License

MIT
