# COSME API Specification

Complete API documentation for integration with platform services.

## Base URL
```
http://localhost:3000
```

## Authentication
Currently endpoints are open. For production, add Bearer token authentication:
```
Authorization: Bearer <api-key>
```

## Health & Status

### GET /health
Health check endpoint

**Response (200 OK):**
```json
{
  "status": "ok",
  "providers": ["hubspot", "meta", "stripe"],
  "timestamp": "2026-04-17T22:34:46.430Z"
}
```

## Credential Management API

### POST /api/orgs/:orgId/credentials
Create a new credential

**Request:**
```json
{
  "provider": "hubspot",
  "credentials": {
    "access_token": "pat_...",
    "refresh_token": "refresh_...",
    "expires_at": 1704067200000
  }
}
```

**Response (201 Created):**
```json
{
  "id": "org123:hubspot:1704067200000",
  "provider": "hubspot",
  "orgId": "org123",
  "createdAt": "2026-04-17T22:34:46.430Z"
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields (provider, credentials)
- `500 Internal Server Error`: Storage failure

---

### GET /api/orgs/:orgId/credentials
List all credentials for an organization

**Response (200 OK):**
```json
{
  "credentials": [
    {
      "id": "org123:hubspot:1704067200000",
      "provider": "hubspot",
      "orgId": "org123",
      "createdAt": "2026-04-17T22:34:46.430Z",
      "hasRefreshToken": true
    },
    {
      "id": "org123:stripe:1704067200001",
      "provider": "stripe",
      "orgId": "org123",
      "createdAt": "2026-04-17T22:34:47.430Z",
      "hasRefreshToken": false
    }
  ],
  "count": 2
}
```

**Note:** Organization isolation is automatic - only credentials for the specified orgId are returned.

---

### GET /api/orgs/:orgId/credentials/:id
Retrieve credential metadata (tokens not returned for security)

**Response (200 OK):**
```json
{
  "id": "org123:hubspot:1704067200000",
  "provider": "hubspot",
  "orgId": "org123",
  "createdAt": "2026-04-17T22:34:46.430Z",
  "hasAccessToken": true,
  "hasRefreshToken": true,
  "expiresAt": 1704067200000
}
```

**Error Responses:**
- `404 Not Found`: Credential does not exist
- `500 Internal Server Error`: Retrieval failure

**Security Note:** Actual tokens (access_token, refresh_token) are never returned. Use this endpoint to check token status, not to retrieve secrets.

---

### PATCH /api/orgs/:orgId/credentials/:id
Update/refresh credential tokens

**Request:**
```json
{
  "access_token": "new_pat_...",
  "refresh_token": "new_refresh_...",
  "expires_at": 1704153600000
}
```

**Allowed Fields:**
- `access_token` (required)
- `refresh_token` (optional)
- `expires_at` (optional)

**Response (200 OK):**
```json
{
  "id": "org123:hubspot:1704067200000",
  "updated": true,
  "updatedAt": "2026-04-17T23:34:46.430Z"
}
```

**Error Responses:**
- `400 Bad Request`: Missing access_token
- `404 Not Found`: Credential does not exist
- `500 Internal Server Error`: Update failure

---

### DELETE /api/orgs/:orgId/credentials/:id
Remove a credential permanently

**Response (200 OK):**
```json
{
  "id": "org123:hubspot:1704067200000",
  "deleted": true
}
```

**Error Responses:**
- `404 Not Found`: Credential does not exist
- `500 Internal Server Error`: Deletion failure

**Warning:** Deletion is permanent. Deleted credentials cannot be recovered.

---

## OAuth Flow Endpoints

### GET /api/oauth/providers
List available OAuth providers

**Response (200 OK):**
```json
{
  "providers": [
    {
      "name": "hubspot",
      "authorizationUrl": "https://app.hubspot.com/oauth/authorize",
      "scopes": ["crm.objects.contacts.read", "crm.objects.contacts.write"]
    },
    {
      "name": "meta",
      "authorizationUrl": "https://www.facebook.com/v18.0/dialog/oauth",
      "scopes": ["instagram_basic", "instagram_content_publish", "pages_show_list"]
    },
    {
      "name": "stripe",
      "authorizationUrl": "https://connect.stripe.com/oauth/authorize",
      "scopes": ["read_write"]
    }
  ]
}
```

---

### GET /api/oauth/:provider/authorize
Initiate OAuth authorization flow

**Query Parameters:**
- `orgId` (required): Organization ID for credential storage
- `redirectUri` (optional): Override default redirect URI
- `state` (optional): Custom state parameter for CSRF protection

**Example:**
```
GET /api/oauth/hubspot/authorize?orgId=org123&redirectUri=https://myapp.com/auth/callback
```

**Response (302 Found):**
Redirects to provider's authorization URL with generated state parameter

**Flow:**
1. User clicks "Connect HubSpot" button
2. Browser redirects to HubSpot authorization
3. User grants permissions
4. HubSpot redirects to callback URL with code
5. Server exchanges code for tokens
6. Credential stored with orgId:provider:timestamp ID

---

### GET /api/oauth/:provider/callback
OAuth provider callback (automatic redirect)

**Query Parameters:**
- `code`: Authorization code from provider
- `state`: CSRF protection parameter

**Response (302 Found):**
Redirects to success or error page

**Automatic Actions:**
- Validates state parameter
- Exchanges code for access token
- Stores credential securely with encryption
- Cleans up state cache

---

### POST /api/oauth/:provider/refresh
Manually refresh access token

**Request:**
```json
{
  "credentialId": "org123:hubspot:1704067200000"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "expiresAt": 1704153600000
}
```

**Error Responses:**
- `404 Not Found`: Credential not found
- `401 Unauthorized`: Refresh token invalid or expired
- `500 Internal Server Error`: Token refresh failed

---

### POST /api/oauth/:provider/revoke
Revoke access and remove credential

**Request:**
```json
{
  "credentialId": "org123:hubspot:1704067200000"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Behavior:**
1. Calls provider's token revocation endpoint
2. Deletes credential from storage
3. Returns success status

**Note:** This operation is permanent - the credential cannot be recovered.

---

## Error Response Format

All errors follow this format:

```json
{
  "error": "Error description",
  "message": "Detailed error message",
  "timestamp": "2026-04-17T22:34:46.430Z"
}
```

**Common HTTP Status Codes:**
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input/missing required fields
- `404 Not Found`: Resource does not exist
- `401 Unauthorized`: Authentication failed or credentials invalid
- `500 Internal Server Error`: Server-side error

---

## Data Models

### Credential Object
```typescript
interface Credential {
  id: string; // "orgId:provider:timestamp"
  provider: string; // "hubspot", "stripe", "meta", etc.
  orgId: string;
  access_token: string; // Encrypted at rest
  refresh_token?: string; // Optional, encrypted
  expires_at?: number; // Unix timestamp in milliseconds
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### Organization Isolation
- Each credential is scoped to an organization (orgId)
- Organizations cannot access other organizations' credentials
- Credential IDs include orgId: `{orgId}:{provider}:{timestamp}`

### Token Encryption
- All tokens encrypted with AES-256-GCM
- Encryption key stored in environment (`ENCRYPTION_KEY`)
- Wrong key will cause decryption to fail gracefully
- Encrypted data includes IV and auth tag

---

## Rate Limiting

**Recommended Limits (not yet implemented):**
- Credential operations: 100 requests/minute per org
- OAuth flows: 10 authorization requests/minute per org
- Token refresh: 1000 requests/minute globally

---

## Security Headers

**Recommended Headers (not yet implemented):**
```
Content-Type: application/json
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000
```

---

## Example Integration Flow

### 1. Create HubSpot Credential via OAuth
```bash
# User clicks "Connect with HubSpot"
curl "http://localhost:3000/api/oauth/hubspot/authorize?orgId=myorg"

# Browser redirects to HubSpot, user authorizes
# HubSpot redirects back to /api/oauth/hubspot/callback?code=...&state=...
# Server automatically stores credential
```

### 2. List Organization's Credentials
```bash
curl http://localhost:3000/api/orgs/myorg/credentials
```

### 3. Refresh Token Before Expiry
```bash
curl -X POST http://localhost:3000/api/oauth/hubspot/refresh \
  -H "Content-Type: application/json" \
  -d '{"credentialId": "myorg:hubspot:1704067200000"}'
```

### 4. Remove Credential
```bash
curl -X DELETE \
  http://localhost:3000/api/orgs/myorg/credentials/myorg:hubspot:1704067200000
```

---

## Webhook Support (Future)

Reserved endpoints for webhook handlers:
- `POST /api/oauth/:provider/webhook` - Provider events
- `POST /api/credentials/webhook` - Expiration notifications

---

## API Versioning

Current version: **v1** (implicit)

Future versions will be explicit:
- `POST /api/v2/orgs/:orgId/credentials`
- Backwards compatibility maintained for v1

---

## Testing Endpoints

For development/testing only:

```bash
# Create test credential
POST /api/orgs/test/credentials
{ "provider": "test", "credentials": { "token": "test" } }

# List test credentials
GET /api/orgs/test/credentials

# Clean up
DELETE /api/orgs/test/credentials/:id
```

---

## Support

For integration issues:
1. Check logs: `npm start | grep -i error`
2. Verify environment variables: Check `.env` file
3. Test health endpoint: `curl /health`
4. Validate credentials are properly created before OAuth refresh
