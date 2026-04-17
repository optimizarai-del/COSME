# COSME API Specification

## Base URL
`http://localhost:3000`

## GET /health
Returns: `{ "status": "ok", "providers": [...], "timestamp": "..." }`

## Credential Endpoints

### POST /api/orgs/:orgId/credentials
Create credential. Body: `{ "provider": "hubspot", "credentials": { "access_token": "..." } }`

### GET /api/orgs/:orgId/credentials
List all credentials for org. Returns sanitized list (no tokens).

### GET /api/orgs/:orgId/credentials/:id
Get credential metadata. Tokens are never returned.

### PATCH /api/orgs/:orgId/credentials/:id
Update/refresh token. Body: `{ "access_token": "new", "expires_at": 1704153600000 }`

### DELETE /api/orgs/:orgId/credentials/:id
Permanently delete credential.

## OAuth Endpoints

### GET /api/oauth/:provider/authorize?orgId=xxx
Redirects to provider authorization URL.

### GET /api/oauth/:provider/callback
Handles code exchange and stores credential.

### POST /api/oauth/:provider/refresh
Body: `{ "credentialId": "org:provider:timestamp" }`

### POST /api/oauth/:provider/revoke
Revokes and deletes credential.

## Security
- AES-256-GCM encryption for all tokens
- Organization isolation on all endpoints
- Credential IDs: orgId:provider:timestamp
