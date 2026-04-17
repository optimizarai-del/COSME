# COSME Deployment Guide

Quick reference for deploying COSME to production and staging environments.

## Quick Start

### Development (Local)
```bash
# Install dependencies
npm install

# Generate encryption key
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Create .env file
cp .env.example .env
# Edit .env with your OAuth provider credentials

# Run tests
npm test

# Start server
npm start

# Health check
curl http://localhost:3000/health
```

### Docker (Recommended)
```bash
# Build image
docker build -t cosme:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -e ENCRYPTION_KEY="$(openssl rand -hex 32)" \
  -e HUBSPOT_CLIENT_ID="..." \
  -e HUBSPOT_CLIENT_SECRET="..." \
  cosme:latest

# Check logs
docker logs <container-id>
```

### Docker Compose
```bash
# Copy environment file
cp .env.example .env

# Start services
docker-compose up -d

# View logs
docker-compose logs -f cosme

# Stop services
docker-compose down
```

## Environment Setup

### Required Variables
```bash
# Encryption (64 hex characters = 32 bytes)
ENCRYPTION_KEY=<generated-via-openssl-rand-hex-32>

# Server
PORT=3000
NODE_ENV=production
```

### Optional: Google Sheets (Phase 2)
```bash
GOOGLE_CLIENT_ID=<from-google-cloud>
GOOGLE_CLIENT_SECRET=<from-google-cloud>
GOOGLE_ACCESS_TOKEN=<user-token>
GOOGLE_REFRESH_TOKEN=<user-refresh-token>
```

### Optional: HubSpot OAuth (Phase 4)
```bash
HUBSPOT_CLIENT_ID=<from-hubspot>
HUBSPOT_CLIENT_SECRET=<from-hubspot>
HUBSPOT_REDIRECT_URI=https://yourdomain.com/api/oauth/hubspot/callback
```

### Optional: Meta OAuth (Phase 4)
```bash
META_CLIENT_ID=<from-facebook>
META_CLIENT_SECRET=<from-facebook>
META_REDIRECT_URI=https://yourdomain.com/api/oauth/meta/callback
```

### Optional: Stripe OAuth (Phase 4)
```bash
STRIPE_CLIENT_ID=<from-stripe>
STRIPE_SECRET_KEY=<from-stripe>
STRIPE_REDIRECT_URI=https://yourdomain.com/api/oauth/stripe/callback
```

## Health Checks

### Liveness Probe
```bash
curl -f http://localhost:3000/health
# Returns 200 with { status: "ok", ... }
```

### Readiness Check
```bash
curl -f http://localhost:3000/health | jq '.status == "ok"'
```

## Kubernetes Deployment

### ConfigMap (non-sensitive)
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cosme-config
data:
  PORT: "3000"
  NODE_ENV: "production"
```

### Secret (sensitive data)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: cosme-secrets
type: Opaque
stringData:
  ENCRYPTION_KEY: "$(openssl rand -hex 32)"
  HUBSPOT_CLIENT_SECRET: "..."
  META_CLIENT_SECRET: "..."
  STRIPE_SECRET_KEY: "..."
```

### Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cosme
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cosme
  template:
    metadata:
      labels:
        app: cosme
    spec:
      containers:
      - name: cosme
        image: cosme:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: cosme-config
        - secretRef:
            name: cosme-secrets
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: cosme
spec:
  selector:
    app: cosme
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Testing Deployment

### 1. Verify Server Started
```bash
curl http://localhost:3000/health
```

### 2. Run Integration Tests
```bash
node examples/integration-test.js
```

### 3. Create Test Credential
```bash
curl -X POST http://localhost:3000/api/orgs/test/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "hubspot",
    "credentials": {
      "access_token": "test-token",
      "refresh_token": "test-refresh"
    }
  }'
```

### 4. Verify Encryption
```bash
# Get the credential ID from response above, then:
curl http://localhost:3000/api/orgs/test/credentials/<id>
# Should return sanitized response (no tokens visible)
```

## Scaling

### Horizontal Scaling
COSME is stateless and can be scaled horizontally:
- Run multiple instances behind a load balancer
- Each instance has independent credential storage (in-memory)
- For persistent storage, add database backend

### Database Backend (Future)
For production with persistence:
1. Replace in-memory Map with database
2. Add connection pooling
3. Implement credential caching layer
4. Add audit logging

## Monitoring

### Key Metrics to Track
- `/health` endpoint response time
- Credential API response times
- OAuth token refresh success rate
- Token expiration warnings (< 1 day)
- Encryption/decryption performance

### Log Format
```
[timestamp] [level] [component] message
2026-04-17T22:34:46.430Z INFO CredentialManager Created credential org123:hubspot:1704067200000
2026-04-17T22:34:47.430Z ERROR OAuthManager HubSpot token refresh failed: 401 Unauthorized
```

### Recommended Logging Setup
- Use structured JSON logging
- Send logs to centralized logging system (ELK, Datadog, etc.)
- Set appropriate log levels:
  - `ERROR` - failures, auth errors
  - `WARN` - token expiring soon
  - `INFO` - API calls, credentials created
  - `DEBUG` - encryption operations, token refresh details

## Updating

### Rolling Update Strategy
```bash
# 1. Pull new image
docker pull cosme:v2.0.0

# 2. Update replica set (K8s handles rolling update)
kubectl set image deployment/cosme \
  cosme=cosme:v2.0.0 \
  --record

# 3. Monitor rollout
kubectl rollout status deployment/cosme

# 4. Rollback if needed
kubectl rollout undo deployment/cosme
```

### Breaking Changes
- Update tests first: `npm test`
- Review API_SPECIFICATION.md for endpoint changes
- Notify platform dev of any deprecations
- Maintain backwards compatibility when possible

## Troubleshooting

### Port Already in Use
```bash
lsof -i :3000
kill -9 <PID>
```

### Encryption Key Issues
```bash
# Key too short (must be 64 hex chars)
openssl rand -hex 32

# Verify key length
echo $ENCRYPTION_KEY | wc -c  # Should be 65 (64 + newline)
```

### Docker Build Fails
```bash
# Clear cache
docker build --no-cache -t cosme:latest .

# Check Node version compatibility
docker run node:20 --version
```

### Credential Decryption Fails
- Check ENCRYPTION_KEY hasn't changed
- Verify credentials haven't been corrupted
- Check error logs for "unable to authenticate data"

### OAuth Token Expired
```bash
# Manual refresh
curl -X POST http://localhost:3000/api/oauth/hubspot/refresh \
  -H "Content-Type: application/json" \
  -d '{"credentialId": "org:hubspot:id"}'
```

## Security Checklist

- [ ] ENCRYPTION_KEY is 64 hex characters
- [ ] ENCRYPTION_KEY is not logged or exposed
- [ ] OAuth secrets are in Kubernetes Secrets (not ConfigMap)
- [ ] CORS is configured for specific domains (not *)
- [ ] API is behind authentication/API key layer
- [ ] HTTPS/TLS enforced in production
- [ ] Credentials never returned in API responses
- [ ] Audit logging enabled for compliance
- [ ] Regular backup of any persistent storage

## Support

For issues:
1. Check logs: `docker logs <container>`
2. Run health check: `curl /health`
3. Run integration tests: `node examples/integration-test.js`
4. Review API_SPECIFICATION.md
5. Check QA_AND_DEPLOYMENT.md for testing procedures
