# COSME Deployment Guide

## Quick Start

```bash
npm install
ENCRYPTION_KEY=$(openssl rand -hex 32)
cp .env.example .env
npm test
npm start
curl http://localhost:3000/health
```

## Docker

```bash
docker build -t cosme:latest .
docker run -d -p 3000:3000 -e ENCRYPTION_KEY="$(openssl rand -hex 32)" cosme:latest
docker-compose up -d
```

## Required Environment Variables

```
ENCRYPTION_KEY=<openssl rand -hex 32>
PORT=3000
NODE_ENV=production
HUBSPOT_CLIENT_ID=...
HUBSPOT_CLIENT_SECRET=...
HUBSPOT_REDIRECT_URI=https://yourdomain.com/api/oauth/hubspot/callback
META_CLIENT_ID=...
META_CLIENT_SECRET=...
META_REDIRECT_URI=https://yourdomain.com/api/oauth/meta/callback
STRIPE_CLIENT_ID=...
STRIPE_SECRET_KEY=...
STRIPE_REDIRECT_URI=https://yourdomain.com/api/oauth/stripe/callback
```

## Security Checklist

- ENCRYPTION_KEY is 64 hex characters and never logged
- OAuth secrets in environment variables, not code
- CORS configured for specific domains
- HTTPS enforced in production
- Audit logging enabled
