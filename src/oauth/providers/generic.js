/**
 * Generic OAuth Provider
 * Phase 4: Configurable OAuth2 provider for any service
 */

export class GenericOAuthProvider {
  constructor(config) {
    this.name = config.name;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.authorizationUrl = config.authorizationUrl;
    this.tokenUrl = config.tokenUrl;
    this.revokeUrl = config.revokeUrl;
    this.scopes = config.scopes || [];
    this.scopeSeparator = config.scopeSeparator || ' ';
  }

  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state || crypto.randomUUID()
    });

    if (this.scopes.length > 0) {
      params.set('scope', this.scopes.join(this.scopeSeparator));
    }

    return `${this.authorizationUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code) {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in,
      expires_at: data.expires_in ? Date.now() + (data.expires_in * 1000) : null,
      scope: data.scope
    };
  }

  async refreshAccessToken(refreshToken) {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in,
      expires_at: data.expires_in ? Date.now() + (data.expires_in * 1000) : null,
      scope: data.scope
    };
  }

  async revokeToken(token) {
    if (!this.revokeUrl) {
      return { revoked: false, message: 'Provider does not support token revocation' };
    }

    const response = await fetch(this.revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        token,
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    });

    return {
      revoked: response.ok,
      status: response.status
    };
  }

  async createWebhookCredential(webhookUrl, secret) {
    return {
      access_token: secret,
      webhook_url: webhookUrl,
      token_type: 'webhook',
      provider: this.name,
      expires_in: null,
      expires_at: null
    };
  }

  async createApiKeyCredential(apiKey) {
    return {
      access_token: apiKey,
      token_type: 'api_key',
      provider: this.name,
      expires_in: null,
      expires_at: null
    };
  }

  getProviderInfo() {
    return {
      name: this.name,
      authUrl: this.authorizationUrl,
      tokenUrl: this.tokenUrl,
      revokeUrl: this.revokeUrl,
      scopes: this.scopes,
      supportsApiKey: true,
      supportsWebhook: true
    };
  }
}
